'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createUserByAdmin,
  deleteProfileById,
  fetchAdminUsers,
  getAvatarPublicUrl,
  type AdminUserProfile,
  updateProfileByIdAdmin,
  uploadAvatar,
} from '@/app/api/client/profiles';
import { fetchOrdersWithItemsByUser } from '@/app/api/client/orders';
import { subscribeAdminDashboard } from '@/app/api/client/realtime';
import PageLoader from '@/app/components/PageLoader/PageLoader';
import AdminShell from '@/app/admin/components/AdminShell/AdminShell';
import { useAdminAccess } from '@/app/admin/useAdminAccess';
import styles from './page.module.scss';

type UserRole = 'user' | 'manager' | 'courier' | 'admin';

type OrderItemType = {
  id: string;
  quantity?: number;
  price_at_time?: number | null;
  menu_items: {
    id: string;
    name: string;
    price: number;
  } | null;
};

type OrderType = {
  id: string;
  created_at: string;
  items: OrderItemType[];
};

function getUserRole(user: AdminUserProfile): UserRole {
  if (user.isAdmin) {
    return 'admin';
  }

  if (user.isManager) {
    return 'manager';
  }

  if (user.isCourer) {
    return 'courier';
  }

  return 'user';
}

function getRoleLabel(role: UserRole) {
  if (role === 'admin') return 'Администратор';
  if (role === 'manager') return 'Менеджер';
  if (role === 'courier') return 'Курьер';
  return 'Пользователь';
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Не указана';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getOrderTotal(order: OrderType) {
  return order.items.reduce((total, item) => {
    const price = item.price_at_time ?? item.menu_items?.price ?? 0;
    return total + price * (item.quantity ?? 1);
  }, 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  bonusPoints: '0',
  role: 'user' as UserRole,
};

export default function AdminUsersPage() {
  const { profile, isChecking } = useAdminAccess();
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserProfile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [ordersPopupOpen, setOrdersPopupOpen] = useState(false);
  const [currentOrders, setCurrentOrders] = useState<OrderType[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    let isMounted = true;

    const loadUsers = async () => {
      const { data, error } = await fetchAdminUsers();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error('Admin users load error:', error);
        setIsLoadingUsers(false);
        return;
      }

      setUsers(
        (data ?? []).map((user) => ({
          ...user,
          phone: user.phone ?? null,
          bonus_points: user.bonus_points ?? 0,
          isOpen: user.isOpen ?? null,
          isAdmin: user.isAdmin ?? null,
          isCourer: user.isCourer ?? null,
          isManager: user.isManager ?? null,
        }))
      );
      setIsLoadingUsers(false);
    };

    loadUsers();
    const unsubscribe = subscribeAdminDashboard(loadUsers);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profile]);

  const stats = useMemo(() => {
    const employees = users.filter((user) => user.isManager || user.isCourer);
    const managers = users.filter((user) => user.isManager);
    const couriers = users.filter((user) => user.isCourer);
    const onShift = employees.filter((user) => user.isOpen);

    return {
      totalUsers: users.length,
      employees: employees.length,
      managers: managers.length,
      couriers: couriers.length,
      onShift: onShift.length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) =>
      [
        user.id,
        user.name,
        user.email,
        user.phone,
        getRoleLabel(getUserRole(user)),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [searchTerm, users]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setAvatar(null);
    setEditingUser(null);
    setModalMode(null);
  };

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setAvatar(null);
    setEditingUser(null);
    setModalMode('create');
  };

  const openEditModal = (user: AdminUserProfile) => {
    setEditingUser(user);
    setForm({
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      password: '',
      bonusPoints: String(user.bonus_points ?? 0),
      role: getUserRole(user),
    });
    setAvatar(null);
    setModalMode('edit');
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      alert('Заполните имя и email');
      return;
    }

    if (modalMode === 'create' && form.password.trim().length < 6) {
      alert('Пароль должен быть не короче 6 символов');
      return;
    }

    setIsSaving(true);

    try {
      if (modalMode === 'create') {
        const { error } = await createUserByAdmin({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          role: form.role === 'admin' ? 'user' : form.role,
        });

        if (error) {
          alert(error.message);
          return;
        }
      } else if (modalMode === 'edit' && editingUser) {
        let avatarUrl = editingUser.avatar_url;

        if (avatar) {
          const fileName = `${Date.now()}-${avatar.name}`;
          const { error: uploadError } = await uploadAvatar(fileName, avatar);

          if (uploadError) {
            alert('Ошибка загрузки аватара');
            return;
          }

          const { data } = getAvatarPublicUrl(fileName);
          avatarUrl = data.publicUrl;
        }

        const role = form.role === 'admin' ? 'admin' : form.role;
        const { error } = await updateProfileByIdAdmin(editingUser.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          bonus_points: Number(form.bonusPoints || 0),
          avatar_url: avatarUrl,
          isAdmin: role === 'admin',
          isManager: role === 'manager',
          isCourer: role === 'courier',
        });

        if (error) {
          alert(error.message);
          return;
        }
      }

      const { data, error } = await fetchAdminUsers();
      if (error) {
        console.error('Admin users reload error:', error);
      } else {
        setUsers((data ?? []) as AdminUserProfile[]);
      }

      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (isDeletingId) {
      return;
    }

    if (!confirm('Удалить пользователя?')) {
      return;
    }

    setIsDeletingId(userId);

    try {
      const { error } = await deleteProfileById(userId);
      if (error) {
        alert(error.message);
        return;
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } finally {
      setIsDeletingId(null);
    }
  };

  const openOrdersPopup = async (userId: string) => {
    setOrdersLoading(true);
    setOrdersPopupOpen(true);

    const { data, error } = await fetchOrdersWithItemsByUser(userId);
    if (error) {
      alert('Ошибка загрузки заказов');
      setCurrentOrders([]);
      setOrdersLoading(false);
      return;
    }

    setCurrentOrders((data as OrderType[]) ?? []);
    setOrdersLoading(false);
  };

  if (isChecking) {
    return <PageLoader label="Проверяем доступ администратора..." />;
  }

  if (!profile) {
    return null;
  }

  return (
    <AdminShell
      profile={profile}
      active="users"
      title="Пользователи и сотрудники"
      subtitle="Ручное создание аккаунтов, назначение ролей менеджера или курьера и быстрый доступ к истории заказов."
      actions={
        <button type="button" className={styles.primaryAction} onClick={openCreateModal}>
          Добавить пользователя
        </button>
      }
    >
      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Всего пользователей</p>
          <p className={styles.metricValue}>{stats.totalUsers}</p>
          <p className={styles.metricHint}>Все аккаунты в системе</p>
        </article>

        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Сотрудников</p>
          <p className={styles.metricValue}>{stats.employees}</p>
          <p className={styles.metricHint}>Менеджеры и курьеры</p>
        </article>

        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Менеджеров</p>
          <p className={styles.metricValue}>{stats.managers}</p>
          <p className={styles.metricHint}>Доступ к менеджерской панели</p>
        </article>

        <article className={styles.metricCard}>
          <p className={styles.metricLabel}>Курьеров</p>
          <p className={styles.metricValue}>{stats.couriers}</p>
          <p className={styles.metricHint}>{stats.onShift} сейчас на смене</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Список аккаунтов</p>
            <h2 className={styles.panelTitle}>Поиск и управление пользователями</h2>
          </div>

          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Поиск</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Имя, email, телефон, id или роль"
            />
          </label>
        </div>

        {isLoadingUsers ? (
          <div className={styles.emptyState}>Загружаем пользователей...</div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            {users.length === 0 ? 'Пользователей пока нет.' : 'По вашему запросу ничего не найдено.'}
          </div>
        ) : (
          <div className={styles.usersList}>
            {filteredUsers.map((user) => {
              const role = getUserRole(user);
              const displayName = user.name?.trim() || user.email?.split('@')[0] || 'Пользователь';

              return (
                <article key={user.id} className={styles.userCard}>
                  <div className={styles.userTop}>
                    <div className={styles.userIdentity}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={displayName} className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarFallback}>{displayName.slice(0, 1).toUpperCase()}</div>
                      )}

                      <div className={styles.userMeta}>
                        <h3 className={styles.userName}>{displayName}</h3>
                        <div className={styles.badges}>
                          <span className={`${styles.badge} ${styles[`role${role[0].toUpperCase()}${role.slice(1)}`]}`}>
                            {getRoleLabel(role)}
                          </span>
                          {(user.isManager || user.isCourer) && user.isOpen ? (
                            <span className={`${styles.badge} ${styles.statusOpen}`}>На смене</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className={styles.actionsRow}>
                      <button type="button" className={styles.secondaryAction} onClick={() => openOrdersPopup(user.id)}>
                        Заказы
                      </button>
                      <button type="button" className={styles.secondaryAction} onClick={() => openEditModal(user)}>
                        Редактировать
                      </button>
                      <button
                        type="button"
                        className={styles.dangerAction}
                        onClick={() => handleDelete(user.id)}
                        disabled={isDeletingId === user.id}
                      >
                        {isDeletingId === user.id ? 'Удаляем...' : 'Удалить'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Email</span>
                      <strong>{user.email || 'Не указан'}</strong>
                    </div>

                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Телефон</span>
                      <strong>{user.phone || 'Не указан'}</strong>
                    </div>

                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Бонусы</span>
                      <strong>{user.bonus_points ?? 0}</strong>
                    </div>

                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Зарегистрирован</span>
                      <strong>{formatDate(user.created_at)}</strong>
                    </div>
                  </div>

                  <p className={styles.userId}>ID: {user.id}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modalMode ? (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>
                  {modalMode === 'create' ? 'Новый аккаунт' : 'Редактирование аккаунта'}
                </p>
                <h2 className={styles.modalTitle}>
                  {modalMode === 'create' ? 'Добавить пользователя вручную' : 'Изменить пользователя'}
                </h2>
              </div>

              <button type="button" className={styles.closeButton} onClick={resetForm} aria-label="Закрыть">
                ×
              </button>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Имя</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Имя пользователя"
                />
              </label>

              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="user@example.com"
                />
              </label>

              <label className={styles.field}>
                <span>Телефон</span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+7..."
                />
              </label>

              <label className={styles.field}>
                <span>Роль</span>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
                  }
                  disabled={editingUser?.isAdmin === true}
                >
                  {editingUser?.isAdmin ? <option value="admin">Администратор</option> : null}
                  <option value="user">Пользователь</option>
                  <option value="manager">Менеджер</option>
                  <option value="courier">Курьер</option>
                </select>
              </label>

              {modalMode === 'create' ? (
                <label className={styles.field}>
                  <span>Пароль</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Не короче 6 символов"
                  />
                </label>
              ) : (
                <>
                  <label className={styles.field}>
                    <span>Бонусы</span>
                    <input
                      type="number"
                      value={form.bonusPoints}
                      onChange={(event) => setForm((prev) => ({ ...prev, bonusPoints: event.target.value }))}
                      placeholder="0"
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Аватар</span>
                    <input type="file" accept="image/*" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
                  </label>
                </>
              )}
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostAction} onClick={resetForm}>
                Отмена
              </button>
              <button type="button" className={styles.primaryAction} onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Сохраняем...' : modalMode === 'create' ? 'Создать аккаунт' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {ordersPopupOpen ? (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.ordersModal}`}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>История заказов</p>
                <h2 className={styles.modalTitle}>Заказы пользователя</h2>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOrdersPopupOpen(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            {ordersLoading ? (
              <div className={styles.emptyState}>Загружаем заказы...</div>
            ) : currentOrders.length === 0 ? (
              <div className={styles.emptyState}>Заказов пока нет.</div>
            ) : (
              <div className={styles.ordersList}>
                {currentOrders.map((order) => (
                  <article key={order.id} className={styles.orderCard}>
                    <div className={styles.orderTop}>
                      <div>
                        <p className={styles.orderId}>Заказ #{order.id.slice(0, 8)}</p>
                        <p className={styles.orderDate}>{formatDate(order.created_at)}</p>
                      </div>

                      <strong className={styles.orderTotal}>{formatCurrency(getOrderTotal(order))}</strong>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((item) => (
                        <span key={item.id} className={styles.itemChip}>
                          {item.menu_items?.name ?? 'Позиция'} x {item.quantity ?? 1}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
