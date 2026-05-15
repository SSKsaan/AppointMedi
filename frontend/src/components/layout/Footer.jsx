import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Stethoscope, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'

function scrollTop() { window.scrollTo(0, 0) }

export default function Footer() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowLogout(false)
    navigate('/')
  }

  return (
    <>
      <footer className="border-t bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="mb-3 text-sm font-semibold">Contact</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2 break-words"><Mail className="h-4 w-4 shrink-0" /> <span>support@appointmedi.com</span></span>
                <span className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +880 1700-000000</span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Dhaka, Bangladesh</span>
              </div>
            </div>
            <div className="lg:pl-8">
              <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/" onClick={scrollTop} className="hover:text-primary">Home</Link>
                {user ? (
                  <>
                    <Link to="/profile" onClick={scrollTop} className="hover:text-primary">Profile</Link>
                    <button onClick={() => setShowLogout(true)} className="text-left hover:text-primary">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={scrollTop} className="hover:text-primary">Login</Link>
                    <Link to="/register" onClick={scrollTop} className="hover:text-primary">Register</Link>
                  </>
                )}
              </div>
            </div>
            <div className="lg:pl-4">
              <h4 className="mb-3 text-sm font-semibold">For Patients</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/appointments/new" onClick={scrollTop} className="hover:text-primary">New Appointment</Link>
                <Link to="/appointments" onClick={scrollTop} className="hover:text-primary">All Appointments</Link>
                <Link to="/payments" onClick={scrollTop} className="hover:text-primary">Transaction History</Link>
              </div>
            </div>
            <div className="sm:text-right lg:text-right">
              <div className="flex items-center gap-2 font-heading text-lg font-bold text-primary sm:justify-end">
                <Stethoscope className="h-5 w-5" />
                AppointMedi
              </div>
              <p className="mt-2 text-sm text-muted-foreground sm:ml-auto sm:max-w-xs">
                Medical appointment mediation platform connecting patients with healthcare providers.
              </p>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AppointMedi. All rights reserved.
          </div>
        </div>
      </footer>

      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4 sm:pt-0">
            <Button variant="outline" onClick={() => setShowLogout(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
