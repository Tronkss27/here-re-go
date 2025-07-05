import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "../../utils/cn";

export interface CalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  locale?: any;
  className?: string;
  initialFocus?: boolean;
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  locale = it,
  className,
  initialFocus,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calcola i giorni vuoti all'inizio del mese per allineare la griglia
  const startDay = getDay(monthStart);
  const emptyDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, (_, i) => i);
  
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  
  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return;
    console.log('Calendar: Date clicked:', date);
    onSelect?.(date);
  };
  
  const isDayDisabled = (date: Date) => disabled?.(date) || false;
  const isDaySelected = (date: Date) => selected ? isSameDay(date, selected) : false;
  const isDayToday = (date: Date) => isToday(date);
  const isDayInCurrentMonth = (date: Date) => isSameMonth(date, currentMonth);

  return (
    <div className={cn("p-4 bg-white border rounded-lg shadow-sm", className)} {...props}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, "MMMM yyyy", { locale })}
        </h2>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-xs font-medium text-gray-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-12" />
        ))}
        
        {/* Actual days */}
        {days.map((date) => {
          const isDisabled = isDayDisabled(date);
          const isSelected = isDaySelected(date);
          const isTodayDate = isDayToday(date);
          const isInCurrentMonth = isDayInCurrentMonth(date);
          
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={cn(
                // Base styles
                "h-12 w-full flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation user-select-none",
                "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                
                // State styles
                {
                  // Always apply cursor-pointer unless disabled
                  "cursor-pointer": !isDisabled,
                  
                  // Selected state
                  "bg-orange-500 text-white hover:bg-orange-600 shadow-md": isSelected,
                  
                  // Today (not selected)
                  "bg-orange-100 text-orange-900 font-semibold": isTodayDate && !isSelected,
                  
                  // Normal days in current month
                  "text-gray-900 hover:bg-orange-50 hover:text-orange-700": isInCurrentMonth && !isSelected && !isTodayDate,
                  
                  // Days outside current month
                  "text-gray-400 hover:text-gray-600": !isInCurrentMonth,
                  
                  // Disabled days
                  "text-gray-300 cursor-not-allowed hover:bg-transparent hover:text-gray-300": isDisabled,
                }
              )}
              style={{
                minHeight: '48px',
                minWidth: '48px',
                userSelect: 'none' // Prevent text selection
              }}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
      
      {/* Footer with today button */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={() => handleDateClick(new Date())}
          className="w-full py-2 px-4 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors touch-manipulation"
          style={{ minHeight: '44px' }}
        >
          Oggi: {format(new Date(), "dd MMMM yyyy", { locale })}
        </button>
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
