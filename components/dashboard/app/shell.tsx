"use client";

import Image from "next/image";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  FileText,
  Languages,
  LockKeyhole,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  UserCircle,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Business,
  NavItem,
  NavSubGroup,
  ViewId,
  createItems,
  navGroups,
  primaryNav,
  isNavSubGroup,
  setupItems,
  Dropdown,
  DropdownButton,
} from "./shared";
import Link from "next/link";

export function Sidebar({
  activeView,
  collapsed,
  groupsOpen,
  onToggleCollapsed,
  onToggleGroup,
  onSelect,
}: {
  activeView: ViewId;
  collapsed: boolean;
  groupsOpen: Record<string, boolean>;
  onToggleCollapsed: () => void;
  onToggleGroup: (key: string) => void;
  onSelect: (view: ViewId) => void;
}) {
  return (
    <aside
      className={`relative hidden shrink-0 border-r border-slate-800/80 bg-[#111827] text-white shadow-xl shadow-slate-950/10 transition-[width] duration-200 md:flex md:flex-col ${
        collapsed ? "w-[70px]" : "w-[204px]"
      }`}
    >
      <div
        className={`relative flex h-16 items-center gap-2 px-3 ${collapsed ? "justify-center" : ""}`}
      >
        {!collapsed && (
          <button
            type="button"
            onClick={() => onSelect("dashboard")}
            className="flex min-w-0 items-center gap-2 rounded-lg text-left"
            title="Özet"
          >
            <Image
              src="/logo.jpg"
              alt="Aloyz"
              width={34}
              height={34}
              className="rounded-md shadow-sm"
            />
            <span className="text-lg font-semibold">Aloyz</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`${collapsed ? "" : "ml-auto"} grid size-8 place-items-center rounded-lg bg-white/8 text-white ring-1 ring-white/10 hover:bg-white/14`}
          title={collapsed ? "Menüyü aç" : "Menüyü daralt"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      <nav
        className={`relative min-h-0 flex-1 overflow-y-auto pb-4 ${collapsed ? "px-[18px]" : "px-2"}`}
      >
        <div className="space-y-1">
          {primaryNav.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              collapsed={collapsed}
              onSelect={onSelect}
            />
          ))}
        </div>
        <div className="mt-2 space-y-1">
          {navGroups.map((group) => {
            const groupActive = group.children.some((item) =>
              isNavSubGroup(item)
                ? item.children.some((child) => child.id === activeView)
                : item.id === activeView,
            );
            const open = !!groupsOpen[group.key] || groupActive;
            const Icon = group.icon;
            return (
              <div key={group.key}>
                <button
                  type="button"
                  onClick={() => onToggleGroup(group.key)}
                  className={`flex h-9 items-center gap-2 rounded-lg text-left text-sm font-medium transition ${
                    groupActive
                      ? "dashboard-nav-active bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  } ${collapsed ? "w-9 justify-center px-0" : "w-full px-2"}`}
                  title={group.label}
                >
                  <span
                    className={`${collapsed ? "hidden" : "min-w-0 flex-1 truncate"}`}
                  >
                    {!collapsed && group.label}
                  </span>
                  {group.beta && !collapsed && (
                    <span className="rounded border border-violet-300 px-1 text-[9px] font-bold text-violet-100">
                      BETA
                    </span>
                  )}
                  <Icon
                    className={`size-4 shrink-0 ${group.iconClassName || ""}`}
                  />
                  {!collapsed && (
                    <ChevronDown
                      className={`size-4 transition ${open ? "rotate-180" : ""}`}
                    />
                  )}
                </button>
                {open && !collapsed && (
                  <div className="ml-2 mt-1 space-y-1 border-l border-white/10 pl-2">
                    {group.children.map((item) =>
                      isNavSubGroup(item) ? (
                        <SidebarSubGroup
                          key={item.key}
                          group={item}
                          activeView={activeView}
                          open={
                            !!groupsOpen[item.key] ||
                            item.children.some(
                              (child) => child.id === activeView,
                            )
                          }
                          onToggle={() => onToggleGroup(item.key)}
                          onSelect={onSelect}
                        />
                      ) : (
                        <SidebarItem
                          key={item.id}
                          item={item}
                          active={activeView === item.id}
                          collapsed={false}
                          onSelect={onSelect}
                          compact
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

export function MobileNavDrawer({
  activeView,
  open,
  groupsOpen,
  onClose,
  onToggleGroup,
  onSelect,
}: {
  activeView: ViewId;
  open: boolean;
  groupsOpen: Record<string, boolean>;
  onClose: () => void;
  onToggleGroup: (key: string) => void;
  onSelect: (view: ViewId) => void;
}) {
  if (!open) return null;

  const selectAndClose = (view: ViewId) => {
    onSelect(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Menüyü kapat"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[min(88vw,360px)] flex-col bg-[#111827] text-white shadow-2xl">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <button
            type="button"
            onClick={() => selectAndClose("dashboard")}
            className="flex min-w-0 items-center gap-3 rounded-lg text-left"
          >
            <Image
              src="/logo.jpg"
              alt="Aloyz"
              width={34}
              height={34}
              className="rounded-md shadow-sm"
            />
            <span className="text-lg font-semibold">Aloyz</span>
          </button>
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={onClose}
            className="ml-auto grid size-9 place-items-center rounded-lg bg-white/8 text-white ring-1 ring-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {primaryNav.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                collapsed={false}
                onSelect={selectAndClose}
              />
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {navGroups.map((group) => {
              const groupActive = group.children.some((item) =>
                isNavSubGroup(item)
                  ? item.children.some((child) => child.id === activeView)
                  : item.id === activeView,
              );
              const openGroup = !!groupsOpen[group.key] || groupActive;
              const Icon = group.icon;
              return (
                <div key={group.key} className="rounded-lg bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => onToggleGroup(group.key)}
                    className="flex h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm font-semibold text-white"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {group.label}
                    </span>
                    <Icon className={`size-4 shrink-0 ${group.iconClassName || ""}`} />
                    <ChevronDown
                      className={`size-4 transition ${openGroup ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openGroup && (
                    <div className="mt-1 space-y-1">
                      {group.children.map((item) =>
                        isNavSubGroup(item) ? (
                          <MobileSubGroup
                            key={item.key}
                            group={item}
                            activeView={activeView}
                            groupsOpen={groupsOpen}
                            onToggleGroup={onToggleGroup}
                            onSelect={selectAndClose}
                          />
                        ) : (
                          <SidebarItem
                            key={item.id}
                            item={item}
                            active={activeView === item.id}
                            collapsed={false}
                            onSelect={selectAndClose}
                            compact
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-white/5 p-1">
            <div className="px-2 py-2 text-xs font-semibold uppercase text-slate-400">
              Kurulum
            </div>
            {setupItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                collapsed={false}
                onSelect={selectAndClose}
                compact
              />
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
}

function MobileSubGroup({
  group,
  activeView,
  groupsOpen,
  onToggleGroup,
  onSelect,
}: {
  group: NavSubGroup;
  activeView: ViewId;
  groupsOpen: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  onSelect: (view: ViewId) => void;
}) {
  const Icon = group.icon;
  const active = group.children.some((item) => item.id === activeView);
  const open = !!groupsOpen[group.key] || active;
  return (
    <div className="rounded-lg">
      <button
        type="button"
        onClick={() => onToggleGroup(group.key)}
        className={`flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-xs font-semibold ${
          active ? "bg-white/12 text-white" : "text-slate-300"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <Icon className={`size-4 shrink-0 ${group.iconClassName || ""}`} />
        <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-2 mt-1 space-y-1 border-l border-white/10 pl-2">
          {group.children.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              collapsed={false}
              onSelect={onSelect}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSubGroup({
  group,
  activeView,
  open,
  onToggle,
  onSelect,
}: {
  group: NavSubGroup;
  activeView: ViewId;
  open: boolean;
  onToggle: () => void;
  onSelect: (view: ViewId) => void;
}) {
  const Icon = group.icon;
  const active = group.children.some((item) => item.id === activeView);
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs font-medium transition ${
          active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <Icon className={`size-4 shrink-0 ${group.iconClassName || ""}`} />
        <ChevronDown
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-2 mt-1 space-y-1 border-l border-white/10 pl-2">
          {group.children.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              collapsed={false}
              onSelect={onSelect}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
  compact,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  compact?: boolean;
  onSelect: (view: ViewId) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`flex h-9 items-center gap-2 rounded-lg text-left text-sm font-medium transition ${
        active ? "dashboard-nav-active bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-white/8 hover:text-white"
      } ${compact ? "text-xs" : ""} ${collapsed ? "w-9 justify-center px-0" : "w-full px-2"}`}
      title={item.label}
    >
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      )}
      {item.beta && !collapsed && (
        <span className="rounded border border-violet-300 px-1 text-[9px] font-bold text-violet-100">
          BETA
        </span>
      )}
      <Icon className={`size-4 shrink-0 ${item.iconClassName || ""}`} />
    </button>
  );
}

export function Topbar({
  business,
  selectedDate,
  searchTerm,
  userName,
  userEmail,
  userImage,
  openMenu,
  onOpenMenu,
  onBack,
  onDateChange,
  onSearchChange,
  onSelectView,
  onOpenModal,
  onCreateItem,
  onOpenMobileNav,
  mobileNavEnabled = true,
}: {
  business: Business;
  selectedDate: string;
  searchTerm: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  openMenu: "date" | "create" | "settings" | "profile" | null;
  onOpenMenu: (menu: "date" | "create" | "settings" | "profile" | null) => void;
  onBack: () => void;
  onDateChange: (date: string) => void;
  onSearchChange: (value: string) => void;
  onSelectView: (view: ViewId) => void;
  onOpenModal: (
    modal: "theme" | "language" | "password" | "notifications",
  ) => void;
  onCreateItem: (label: string) => void;
  onOpenMobileNav: () => void;
  mobileNavEnabled?: boolean;
}) {
  return (
    <header className="z-20 h-16 shrink-0 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="flex h-full items-center gap-2 px-3 md:gap-3 md:px-6">
        {mobileNavEnabled && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenMobileNav}
            className="h-9 border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
          >
            <Menu className="size-4" />
            Menü
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="hidden h-9 border-slate-200 bg-white text-slate-700 shadow-sm sm:inline-flex"
        >
          <ChevronLeft className="size-4" />
          Geri
        </Button>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => onOpenMenu(openMenu === "date" ? null : "date")}
            className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
            title="Takvim tarihi"
          >
            <CalendarDays className="size-5" />
          </button>
          {openMenu === "date" && (
            <Dropdown className="w-[calc(100vw-2rem)] max-w-64 p-3 sm:w-64">
              <Label className="text-xs text-slate-500">Takvim tarihi</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => onDateChange(event.target.value)}
                className="mt-2"
              />
              <Button
                type="button"
                className="mt-3 w-full bg-[#5f86b6] text-white"
                onClick={() => onSelectView("calendar")}
              >
                Takvimi aç
              </Button>
            </Dropdown>
          )}
        </div>

        <div className="relative hidden min-w-[220px] max-w-[420px] flex-1 sm:block">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-300" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Müşteri ara..."
            className="h-9 rounded-lg border-slate-200 bg-slate-50 pr-10 shadow-none hover:bg-white focus-visible:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={() => onOpenModal("notifications")}
          className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
          title="Bildirimler"
        >
          <Bell className="size-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => onOpenMenu(openMenu === "create" ? null : "create")}
            className="grid size-9 place-items-center rounded-lg bg-slate-900 text-white shadow-sm hover:bg-slate-800"
            title="Yeni oluştur"
          >
            <Plus className="size-6" />
          </button>
          {openMenu === "create" && (
            <Dropdown className="w-52 py-1">
              {createItems.map((item) => (
                <DropdownButton
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => {
                    onCreateItem(item.label);
                    onOpenMenu(null);
                  }}
                />
              ))}
            </Dropdown>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              onOpenMenu(openMenu === "settings" ? null : "settings")
            }
            className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
            title="Ayarlar"
          >
            <Settings className="size-5" />
          </button>
          {openMenu === "settings" && (
            <Dropdown className="w-64 py-1">
              <div className="bg-[#5f86b6] px-3 py-2 text-sm font-semibold text-white">
                Kurulum
              </div>
              {setupItems.map((item) => (
                <DropdownButton
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => onSelectView(item.id)}
                />
              ))}
            </Dropdown>
          )}
        </div>

        <div className="relative ">
          <button
            type="button"
            onClick={() =>
              onOpenMenu(openMenu === "profile" ? null : "profile")
            }
            className="flex h-12 items-center gap-3 rounded-xl px-2 text-left hover:bg-slate-100"
          >
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={38}
                height={38}
                className="rounded-full"
              />
            ) : (
              <UserCircle className="size-10 text-slate-500" />
            )}
            <span className="hidden min-w-0 md:block">
              <span className="block truncate text-sm font-semibold text-slate-600">
                {business.slug || userName}
              </span>
              <span className="block truncate text-xs text-slate-400">
                {userEmail}
              </span>
            </span>
            <ChevronDown className="hidden size-4 text-slate-500 md:block" />
          </button>
          {openMenu === "profile" && (
            <Dropdown className="right-0 w-64 py-1">
              <DropdownButton
                icon={ShoppingBag}
                label="Üyelik"
                onClick={() => onSelectView("subscription")}
              />
              <DropdownButton
                icon={Settings}
                label="Tema ayarları"
                onClick={() => onOpenModal("theme")}
              />
              <DropdownButton
                icon={Languages}
                label="Dil değiştir"
                onClick={() => onOpenModal("language")}
              />
              <DropdownButton
                icon={LockKeyhole}
                label="Şifre değiştir"
                onClick={() => onOpenModal("password")}
              />
              <DropdownButton
                icon={FileText}
                label="Faturalar"
                onClick={() => onSelectView("invoice/list")}
              />
              <DropdownButton
                icon={LogOut}
                label="Çıkış"
                onClick={() => signOut({ callbackUrl: "/" })}
              />
            </Dropdown>
          )}
        </div>
      </div>
    </header>
  );
}
