import * as React from 'react'
import { cn } from '@/lib/utils'

const TabsContext = React.createContext(null)

const Tabs = React.forwardRef(({ defaultValue, value, onValueChange, className, children, ...props }, ref) => {
  const [tabValue, setTabValue] = React.useState(value || defaultValue || '')
  const activeValue = value !== undefined ? value : tabValue

  const handleChange = (val) => {
    if (onValueChange) onValueChange(val)
    else setTabValue(val)
  }

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleChange }}>
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
})
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)} {...props} />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef(({ value, className, ...props }, ref) => {
  const ctx = React.useContext(TabsContext)
  const isActive = ctx?.value === value
  return (
    <button
      ref={ref}
      role="tab"
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive && 'bg-background text-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = React.forwardRef(({ value, className, ...props }, ref) => {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return (
    <div ref={ref} role="tabpanel" className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)} {...props} />
  )
})
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
