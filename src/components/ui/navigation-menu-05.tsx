"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";

export type NavItem = { title: string; href: string; icon: LucideIcon };

// Меню с иконками и подчёркиванием: активный пункт подчёркнут «ручкой проверяющего»
export default function NavigationMenuWithActiveItem({
  items,
  active,
  className,
}: {
  items: NavItem[];
  active?: string;
  className?: string;
}) {
  return (
    <NavigationMenu className={className} aria-label="Основное меню">
      <NavigationMenuList className="space-x-0 gap-5 xl:gap-7">
        {items.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink
              active={active === item.href}
              asChild
              className={cn(
                "group relative inline-flex h-10 w-max items-center justify-center px-0.5 py-2 text-[15px] font-medium text-text transition-colors",
                "before:absolute before:inset-x-0 before:bottom-0 before:h-[3px] before:origin-left before:scale-x-0 before:rounded-full before:bg-check before:transition-transform",
                "hover:text-ink hover:before:scale-x-100",
                "focus:text-ink focus:outline-hidden focus-visible:before:scale-x-100",
                "data-active:font-semibold data-active:text-ink data-active:before:scale-x-100",
              )}
            >
              <Link className="flex-row items-center gap-2" href={item.href} aria-current={active === item.href ? "true" : undefined}>
                {/* на узких десктопах иконки скрыты, чтобы шапка помещалась в одну строку */}
                <item.icon className="hidden size-[18px] shrink-0 xl:block text-ink/70 transition-colors group-hover:text-ink group-data-active:text-check" />
                {item.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
