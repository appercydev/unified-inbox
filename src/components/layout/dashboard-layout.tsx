'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import { AuthUser } from '@/types/auth'
import { 
  HomeIcon, 
  UserIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon,
  CogIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: AuthUser
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const getNavigationItems = () => {
    const role = user.tenantUser.role
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        current: pathname === '/dashboard',
      },
    ]

    if (role === 'SUPER_ADMIN') {
      return [
        ...baseItems,
        {
          name: 'All Users',
          href: '/superadmin/users',
          icon: UsersIcon,
          current: pathname?.includes('/superadmin/users'),
        },
        {
          name: 'All Chats',
          href: '/superadmin/chats',
          icon: ChatBubbleLeftRightIcon,
          current: pathname?.includes('/superadmin/chats'),
        },
      ]
    }

    if (role === 'TENANT_OWNER') {
      return [
        ...baseItems,
        {
          name: 'Users',
          href: '/dashboard/users',
          icon: UsersIcon,
          current: pathname?.includes('/dashboard/users'),
        },
        {
          name: 'Organization',
          href: '/dashboard/organization',
          icon: BuildingOfficeIcon,
          current: pathname?.includes('/dashboard/organization'),
        },
        {
          name: 'Integrations',
          href: '/dashboard/integrations',
          icon: CogIcon,
          current: pathname?.includes('/dashboard/integrations'),
        },
        {
          name: 'Billing',
          href: '/dashboard/billing',
          icon: CreditCardIcon,
          current: pathname?.includes('/dashboard/billing'),
        },
      ]
    }

    if (role === 'TENANT_ADMIN') {
      return [
        ...baseItems,
        {
          name: 'Users',
          href: '/dashboard/users',
          icon: UsersIcon,
          current: pathname?.includes('/dashboard/users'),
        },
        {
          name: 'Integrations',
          href: '/dashboard/integrations',
          icon: CogIcon,
          current: pathname?.includes('/dashboard/integrations'),
        },
      ]
    }

    if (role === 'TENANT_MANAGER') {
      return [
        ...baseItems,
        {
          name: 'Chats',
          href: '/dashboard/chats',
          icon: ChatBubbleLeftRightIcon,
          current: pathname?.includes('/dashboard/chats'),
        },
        {
          name: 'Users',
          href: '/dashboard/users',
          icon: UsersIcon,
          current: pathname?.includes('/dashboard/users'),
        },
      ]
    }

    if (role === 'TENANT_USER') {
      return [
        ...baseItems,
        {
          name: 'Chats',
          href: '/dashboard/chats',
          icon: ChatBubbleLeftRightIcon,
          current: pathname?.includes('/dashboard/chats'),
        },
      ]
    }

    return baseItems
  }

  const navigation = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h1 className="text-lg font-semibold text-gray-900">Unified Inbox</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center h-16 px-4 border-b">
            <h1 className="text-lg font-semibold text-gray-900">Unified Inbox</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="lg:hidden text-gray-400 hover:text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.tenant.name}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">{user.tenantUser.role.replace('_', ' ')}</span>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.tenantUser.first_name[0]}{user.tenantUser.last_name[0]}
                    </span>
                  </div>
                </button>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center text-sm text-gray-700 hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
