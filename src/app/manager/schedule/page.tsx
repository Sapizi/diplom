'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from '@/app/api/client/auth';
import {
  createManagerShift,
  deleteManagerShift,
  fetchManagerEmployees,
  fetchManagerShifts,
  setManagerEmployeeOpen,
  type ManagerEmployee,
  type ManagerShift,
} from '@/app/api/client/manager';
import { subscribeManagerWorkspace } from '@/app/api/client/realtime';
import { useManagerAccess } from '../useManagerAccess';
import styles from './page.module.scss';

const DEFAULT_TIMELINE_START = 8 * 60;
const DEFAULT_TIMELINE_END = 22 * 60;

function getTodayValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToLabel(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getEmployeeLabel(employee: ManagerEmployee) {
  return employee.name || employee.email || employee.phone || employee.id;
}

function getEmployeeSearchText(employee: ManagerEmployee) {
  return [employee.name, employee.email, employee.phone, employee.id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getTimelineBounds(shifts: ManagerShift[]) {
  if (!shifts.length) {
    return {
      start: DEFAULT_TIMELINE_START,
      end: DEFAULT_TIMELINE_END,
    };
  }

  const starts = shifts.map((shift) => parseTimeToMinutes(shift.start_time));
  const ends = shifts.map((shift) => parseTimeToMinutes(shift.end_time));

  const earliest = Math.min(...starts);
  const latest = Math.max(...ends);

  return {
    start: Math.min(DEFAULT_TIMELINE_START, Math.floor(earliest / 60) * 60),
    end: Math.max(DEFAULT_TIMELINE_END, Math.ceil(latest / 60) * 60),
  };
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.5L12 5L20 11.5V19H14.5V14.5H9.5V19H4V11.5Z" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3V6M17 3V6M4 9H20M6.5 5H17.5C18.8807 5 20 6.11929 20 7.5V18C20 19.3807 18.8807 20.5 17.5 20.5H6.5C5.11929 20.5 4 19.3807 4 18V7.5C4 6.11929 5.11929 5 6.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
        fill="currentColor"
      />
      <path d="M4 20C4.8 16.9 7.65 14.75 12 14.75C16.35 14.75 19.2 16.9 20 20" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14 8L19 12L14 16M19 12H10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function formatScheduleDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T12:00:00`));
}

function ManagerSchedulePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isChecking } = useManagerAccess();
  const [employees, setEmployees] = useState<ManagerEmployee[]>([]);
  const [shifts, setShifts] = useState<ManagerShift[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayValue);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('18:00');
  const [comment, setComment] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const employeeId = searchParams.get('employeeId');
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    let isMounted = true;

    const loadWorkspace = async () => {
      const [{ data: employeesData, error: employeesError }, { data: shiftsData, error: shiftsError }] =
        await Promise.all([fetchManagerEmployees(), fetchManagerShifts(selectedDate)]);

      if (!isMounted) {
        return;
      }

      if (employeesError || shiftsError) {
        console.error('Manager schedule load error:', employeesError ?? shiftsError);
        setIsLoading(false);
        return;
      }

      setEmployees(employeesData ?? []);
      setShifts((shiftsData ?? []).sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)));
      setIsLoading(false);
    };

    loadWorkspace();

    const unsubscribe = subscribeManagerWorkspace(loadWorkspace, `manager-schedule-${profile.id}`);
    const fallbackRefresh = window.setInterval(loadWorkspace, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(fallbackRefresh);
      unsubscribe();
    };
  }, [profile, selectedDate]);

  useEffect(() => {
    if (!selectedEmployeeId || !employees.length) {
      return;
    }

    const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
    if (selectedEmployee) {
      setEmployeeQuery(getEmployeeLabel(selectedEmployee));
    }
  }, [employees, selectedEmployeeId]);

  const displayName = useMemo(() => {
    const profileName = profile?.name?.trim();
    if (profileName) {
      return profileName;
    }

    return profile?.email.split('@')[0] || 'Менеджер';
  }, [profile]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId]
  );

  const employeeSuggestions = useMemo(() => {
    const normalizedQuery = employeeQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return employees.slice(0, 6);
    }

    return employees
      .filter((employee) => getEmployeeSearchText(employee).includes(normalizedQuery))
      .slice(0, 6);
  }, [employeeQuery, employees]);

  const timeline = useMemo(() => {
    const bounds = getTimelineBounds(shifts);
    const totalMinutes = Math.max(60, bounds.end - bounds.start);
    const hours: number[] = [];

    for (let current = bounds.start; current <= bounds.end; current += 60) {
      hours.push(current);
    }

    const rows = shifts.map((shift) => {
      const start = parseTimeToMinutes(shift.start_time);
      const end = parseTimeToMinutes(shift.end_time);
      const left = ((start - bounds.start) / totalMinutes) * 100;
      const width = ((Math.max(end, start + 30) - start) / totalMinutes) * 100;

      return {
        shift,
        left: Math.max(0, Math.min(100, left)),
        width: Math.max(6, Math.min(100, width)),
      };
    });

    return {
      hours,
      rows,
    };
  }, [shifts]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Manager logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleSelectEmployee = (employee: ManagerEmployee) => {
    setSelectedEmployeeId(employee.id);
    setEmployeeQuery(getEmployeeLabel(employee));
  };

  const handleCreateShift = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedEmployeeId) {
      alert('Выбери курьера для смены');
      return;
    }

    setIsSaving(true);

    const { data, error } = await createManagerShift({
      employeeId: selectedEmployeeId,
      shiftDate: selectedDate,
      startTime,
      endTime,
      comment,
    });

    if (error) {
      console.error('Manager create shift error:', error);
      alert(error.message ?? 'Не удалось создать смену');
      setIsSaving(false);
      return;
    }

    setShifts((data ?? []).sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)));
    setComment('');
    setIsSaving(false);
  };

  const handleDeleteShift = async (shiftId: string) => {
    setDeletingId(shiftId);

    const { data, error } = await deleteManagerShift(shiftId);

    if (error) {
      console.error('Manager delete shift error:', error);
      alert(error.message ?? 'Не удалось удалить смену');
      setDeletingId(null);
      return;
    }

    setShifts((data ?? []).sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)));
    setDeletingId(null);
  };

  const handleToggleShift = async (employee: ManagerEmployee) => {
    setTogglingId(employee.id);

    const nextValue = !employee.isOpen;
    const { error } = await setManagerEmployeeOpen(employee.id, nextValue);

    if (error) {
      console.error('Manager schedule toggle error:', error);
      alert(error.message ?? 'Не удалось изменить состояние смены');
      setTogglingId(null);
      return;
    }

    setEmployees((prev) =>
      prev.map((item) => (item.id === employee.id ? { ...item, isOpen: nextValue } : item))
    );
    setShifts((prev) =>
      prev.map((shift) =>
        shift.employee?.id === employee.id
          ? { ...shift, employee: shift.employee ? { ...shift.employee, isOpen: nextValue } : null }
          : shift
      )
    );
    setTogglingId(null);
  };

  if (isChecking) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>Проверяем доступ менеджера...</div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={styles.page}>
      <button
        type="button"
        className={`${styles.overlay} ${isMenuOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsMenuOpen(false)}
        aria-label="Закрыть меню"
      />

      <aside className={`${styles.sidebar} ${isMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link href="/manager/main" className={styles.logoLink}>
            <img src="/logo.svg" alt="Логотип" className={styles.logo} />
          </Link>

          <div className={styles.profileCard}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{displayName.slice(0, 1).toUpperCase()}</div>
            )}

            <div className={styles.profileMeta}>
              <p className={styles.profileName}>{displayName}</p>
              <p className={styles.profileRole}>Менеджер смены</p>
            </div>
          </div>

          <nav className={styles.nav}>
            <Link href="/manager/main" className={styles.navItem}>
              <HomeIcon />
              <span>Главная</span>
            </Link>
            <Link href="/manager/schedule" className={`${styles.navItem} ${styles.navItemActive}`}>
              <CalendarIcon />
              <span>График</span>
            </Link>
            <Link href="/manager/staff" className={styles.navItem}>
              <StaffIcon />
              <span>Сотрудники</span>
            </Link>
          </nav>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogoutIcon />
          <span>{isLoggingOut ? 'Выходим...' : 'Выйти'}</span>
        </button>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <MenuIcon />
          </button>

          <div>
            <p className={styles.eyebrow}>График смен</p>
            <h1 className={styles.title}>Кто и со скольки работает</h1>
            <p className={styles.subtitle}>{formatScheduleDate(selectedDate)}</p>
          </div>
        </header>

        <section className={styles.controls}>
          <article className={styles.formCard}>
            <h2 className={styles.cardTitle}>Новая смена</h2>

            <form className={styles.form} onSubmit={handleCreateShift}>
              <label className={styles.field}>
                <span>Дата</span>
                <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              </label>

              <div className={styles.field}>
                <span>Курьер</span>
                <input
                  type="text"
                  value={employeeQuery}
                  onChange={(event) => {
                    setEmployeeQuery(event.target.value);
                    setSelectedEmployeeId('');
                  }}
                  placeholder="Начни вводить имя, телефон или почту"
                />

                <div className={styles.employeeLookup}>
                  {employeeSuggestions.length > 0 ? (
                    employeeSuggestions.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        className={`${styles.employeeOption} ${
                          selectedEmployeeId === employee.id ? styles.employeeOptionActive : ''
                        }`}
                        onClick={() => handleSelectEmployee(employee)}
                      >
                        <strong>{employee.name || 'Без имени'}</strong>
                        <span>{employee.email || employee.phone || employee.id}</span>
                      </button>
                    ))
                  ) : (
                    <div className={styles.employeeEmpty}>Ничего не найдено. Попробуй другое имя или почту.</div>
                  )}
                </div>
              </div>

              <div className={styles.timeGrid}>
                <label className={styles.field}>
                  <span>С</span>
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </label>

                <label className={styles.field}>
                  <span>До</span>
                  <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                </label>
              </div>

              <label className={styles.field}>
                <span>Комментарий</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Например: пик на доставке после 18:00"
                  rows={3}
                />
              </label>

              <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                {isSaving ? 'Сохраняем...' : 'Добавить смену'}
              </button>
            </form>
          </article>

          <article className={styles.infoCard}>
            <h2 className={styles.cardTitle}>По выбранной дате</h2>
            <p className={styles.infoValue}>{shifts.length}</p>
            <p className={styles.infoText}>смен в расписании</p>
            <p className={styles.infoText}>
              Выбранный курьер: {selectedEmployee?.name || selectedEmployee?.email || 'не выбран'}
            </p>
          </article>
        </section>

        {isLoading ? (
          <div className={styles.emptyState}>Загружаем график...</div>
        ) : shifts.length === 0 ? (
          <div className={styles.emptyState}>На эту дату смен пока нет.</div>
        ) : (
          <>
            <section className={styles.timelineCard}>
              <div className={styles.timelineHeader}>
                <div>
                  <p className={styles.timelineEyebrow}>График по часам</p>
                  <h2 className={styles.timelineTitle}>Смены на одной шкале времени</h2>
                </div>
                <p className={styles.timelineHint}>Полоса показывает реальное время работы каждого курьера.</p>
              </div>

              <div className={styles.timeline}>
                <div className={styles.timelineScale}>
                  <div className={styles.timelineLabelSpacer} />
                  <div className={styles.timelineHours}>
                    {timeline.hours.map((hour) => (
                      <span key={hour}>{formatMinutesToLabel(hour)}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.timelineRows}>
                  {timeline.rows.map(({ shift, left, width }) => (
                    <div key={shift.id} className={styles.timelineRow}>
                      <div className={styles.timelineEmployee}>
                        <strong>{shift.employee?.name || shift.employee?.email || 'Курьер'}</strong>
                        <span>{shift.employee?.phone || `${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)}`}</span>
                      </div>

                      <div className={styles.timelineTrack}>
                        {timeline.hours.map((hour) => (
                          <span
                            key={`${shift.id}-${hour}`}
                            className={styles.timelineGridLine}
                            style={{ left: `${((hour - timeline.hours[0]) / Math.max(60, timeline.hours[timeline.hours.length - 1] - timeline.hours[0])) * 100}%` }}
                          />
                        ))}

                        <div
                          className={styles.timelineBar}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                        >
                          <span>{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={styles.scheduleList}>
              {shifts.map((shift) => (
                <article key={shift.id} className={styles.shiftCard}>
                  <div className={styles.shiftHeader}>
                    <div>
                      <p className={styles.shiftTime}>
                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                      </p>
                      <h2 className={styles.shiftEmployee}>
                        {shift.employee?.name || shift.employee?.email || 'Курьер'}
                      </h2>
                      <p className={styles.shiftMeta}>
                        {shift.employee?.phone || shift.employee?.email || 'Контакты не указаны'}
                      </p>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${
                        shift.employee?.isOpen ? styles.statusOpen : styles.statusClosed
                      }`}
                    >
                      {shift.employee?.isOpen ? 'Смена открыта' : 'Смена закрыта'}
                    </span>
                  </div>

                  {shift.comment ? <p className={styles.shiftComment}>{shift.comment}</p> : null}

                  <div className={styles.shiftActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => shift.employee && handleToggleShift(shift.employee)}
                      disabled={!shift.employee || togglingId === shift.employee.id}
                    >
                      {shift.employee?.isOpen ? 'Закрыть смену' : 'Открыть смену'}
                    </button>

                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDeleteShift(shift.id)}
                      disabled={deletingId === shift.id}
                    >
                      {deletingId === shift.id ? 'Удаляем...' : 'Удалить'}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default function ManagerSchedulePage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.loadingState}>Загружаем график...</div>
        </main>
      }
    >
      <ManagerSchedulePageContent />
    </Suspense>
  );
}
