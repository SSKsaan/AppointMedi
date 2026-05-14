import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Stethoscope, User, LogOut, Moon, Sun, LayoutDashboard, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { toast } from 'sonner'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowLogoutConfirm(false)
    toast.success('Logged out successfully')
    navigate('/')
  }

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-primary shrink-0">
            <Stethoscope className="h-6 w-6" />
            AppointMedi
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-2 sm:gap-3">
            {user && !isMobile && (
              <>
                <Link to={isAdmin ? '/admin' : '/appointments'} className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Link>
                {!isAdmin && (
                  <Link to="/top-up">
                    <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
                      <Wallet className="h-4 w-4 text-primary" />
                      BDT {parseFloat(user.balance || 0).toFixed(2)}
                    </Button>
                  </Link>
                )}
              </>
            )}

            {!isMobile && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    <Link to="/profile">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="max-w-[120px] truncate">{user.full_name || user.email?.split('@')[0]}</span>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirm(true)} aria-label="Logout">
                      <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                    <Link to="/register"><Button size="sm">Register</Button></Link>
                  </div>
                )}
              </>
            )}

            <button
              onClick={toggleTheme}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>

        {isMobile && mobileOpen && (
          <div className="border-t bg-background px-4 pb-4 pt-2">
            <div className="flex flex-col gap-1">
              {user ? (
                <>
                  <MobileNavLink to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)} icon={LayoutDashboard}>
                    Dashboard
                  </MobileNavLink>
                  {!isAdmin && (
                    <Link to="/top-up" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                      <Wallet className="h-4 w-4 text-primary" />
                      Balance: BDT {parseFloat(user.balance || 0).toFixed(2)}
                    </Link>
                  )}
                  <MobileNavLink to="/profile" onClick={() => setMobileOpen(false)} icon={User}>
                    Profile
                  </MobileNavLink>
                  <button
                    onClick={() => { setShowLogoutConfirm(true); setMobileOpen(false) }}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink to="/login" onClick={() => setMobileOpen(false)}>Login</MobileNavLink>
                  <MobileNavLink to="/register" onClick={() => setMobileOpen(false)}>Register</MobileNavLink>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4 sm:pt-0">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MobileNavLink({ to, onClick, icon: Icon, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  )
}
