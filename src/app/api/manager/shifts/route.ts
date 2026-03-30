import { NextResponse } from 'next/server';
import { authenticateRequest, createServiceSupabase } from '@/app/api/server/supabaseService';

type ShiftBody = {
  employeeId?: string;
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  comment?: string;
};

type DeleteBody = {
  shiftId?: string;
};

async function loadShiftsByDate(shiftDate: string) {
  const supabase = createServiceSupabase();
  const { data: shifts, error: shiftsError } = await supabase
    .from('employee_shifts')
    .select('id, employee_id, shift_date, start_time, end_time, comment, created_at, updated_at')
    .eq('shift_date', shiftDate)
    .order('start_time', { ascending: true });

  if (shiftsError) {
    throw new Error(shiftsError.message);
  }

  const employeeIds = Array.from(new Set((shifts ?? []).map((shift) => String(shift.employee_id))));
  const employeesMap = new Map<string, any>();

  if (employeeIds.length > 0) {
    const { data: employees, error: employeesError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, avatar_url, "isOpen"')
      .in('id', employeeIds);

    if (employeesError) {
      throw new Error(employeesError.message);
    }

    (employees ?? []).forEach((employee) => {
      employeesMap.set(String(employee.id), employee);
    });
  }

  return (shifts ?? []).map((shift) => ({
    ...shift,
    employee: employeesMap.get(String(shift.employee_id)) ?? null,
  }));
}

export async function GET(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isManager && !profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const shiftDate = searchParams.get('date');

    if (!shiftDate) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    const shifts = await loadShiftsByDate(shiftDate);
    return NextResponse.json({ shifts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load shifts';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isManager && !profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as ShiftBody;
    const employeeId = body.employeeId?.trim();
    const shiftDate = body.shiftDate?.trim();
    const startTime = body.startTime?.trim();
    const endTime = body.endTime?.trim();
    const comment = body.comment?.trim() || null;

    if (!employeeId || !shiftDate || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing shift payload fields' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from('employee_shifts')
      .insert({
        employee_id: employeeId,
        shift_date: shiftDate,
        start_time: startTime,
        end_time: endTime,
        comment,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create shift' }, { status: 500 });
    }

    const shifts = await loadShiftsByDate(shiftDate);
    return NextResponse.json({ shiftId: data.id, shifts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create shift';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { profile } = await authenticateRequest(req);

    if (!profile?.isManager && !profile?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as DeleteBody;
    const shiftId = body.shiftId?.trim();

    if (!shiftId) {
      return NextResponse.json({ error: 'Missing shiftId' }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: currentShift, error: shiftError } = await supabase
      .from('employee_shifts')
      .select('shift_date')
      .eq('id', shiftId)
      .maybeSingle();

    if (shiftError || !currentShift?.shift_date) {
      return NextResponse.json({ error: shiftError?.message ?? 'Shift not found' }, { status: 404 });
    }

    const { error } = await supabase.from('employee_shifts').delete().eq('id', shiftId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const shifts = await loadShiftsByDate(String(currentShift.shift_date));
    return NextResponse.json({ shifts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete shift';
    const status = message === 'Missing access token' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
