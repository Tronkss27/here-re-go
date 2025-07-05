import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '../utils/cn';

// Set Italian locale for moment
moment.locale('it');
const localizer = momentLocalizer(moment);

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  isBooking?: boolean;
  isMatch?: boolean;
  venueId?: string;
}

interface CalendarComponentProps {
  events?: CalendarEvent[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  view?: View;
  showToolbar?: boolean;
  height?: number;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  events = [],
  selectedDate,
  onSelectDate,
  onSelectEvent,
  minDate,
  maxDate,
  className,
  view = Views.MONTH,
  showToolbar = true,
  height = 500
}) => {
  const [currentView, setCurrentView] = useState<View>(view);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Custom event styling with SPOrTS theme
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#f97316'; // Orange-500 default
    let border = '1px solid #ea580c'; // Orange-600
    
    if (event.isMatch) {
      backgroundColor = '#dc2626'; // Red-600 for matches
      border = '1px solid #b91c1c'; // Red-700
    } else if (event.isBooking) {
      backgroundColor = '#059669'; // Emerald-600 for bookings
      border = '1px solid #047857'; // Emerald-700
    }

    return {
      style: {
        backgroundColor,
        border,
        borderRadius: '6px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }
    };
  }, []);

  // Handle slot selection (clicking on empty time slots)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    if (onSelectDate) {
      onSelectDate(slotInfo.start);
    }
  }, [onSelectDate]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    }
  }, [onSelectEvent]);

  // Custom date validation
  const isValidDate = useCallback((date: Date) => {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  }, [minDate, maxDate]);

  // Custom toolbar messages in Italian
  const messages = useMemo(() => ({
    date: 'Data',
    time: 'Ora',
    event: 'Evento',
    allDay: 'Tutto il giorno',
    week: 'Settimana',
    work_week: 'Settimana lavorativa',
    day: 'Giorno',
    month: 'Mese',
    previous: 'Precedente',
    next: 'Successivo',
    yesterday: 'Ieri',
    tomorrow: 'Domani',
    today: 'Oggi',
    agenda: 'Agenda',
    noEventsInRange: 'Nessun evento in questo periodo.',
    showMore: (total: number) => `+ Altri ${total}`
  }), []);

  // Custom formats for Italian display
  const formats = useMemo(() => ({
    dayFormat: 'dd',
    dayHeaderFormat: 'dddd DD/MM',
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`,
    monthHeaderFormat: 'MMMM YYYY',
    weekdayFormat: 'dddd',
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`,
    agendaTimeFormat: 'HH:mm',
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
  }), []);

  return (
    <div className={cn("sports-calendar", className)}>
      <style jsx global>{`
        .sports-calendar .rbc-calendar {
          font-family: inherit;
        }
        
        .sports-calendar .rbc-toolbar {
          background: #f97316;
          color: white;
          padding: 12px;
          border-radius: 8px 8px 0 0;
          margin-bottom: 0;
        }
        
        .sports-calendar .rbc-toolbar button {
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 4px;
          margin: 0 2px;
          transition: all 0.2s;
        }
        
        .sports-calendar .rbc-toolbar button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }
        
        .sports-calendar .rbc-toolbar button.rbc-active {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.6);
        }
        
        .sports-calendar .rbc-month-view,
        .sports-calendar .rbc-time-view {
          border: 1px solid #e5e7eb;
          border-radius: 0 0 8px 8px;
        }
        
        .sports-calendar .rbc-header {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding: 8px;
          font-weight: 600;
          color: #374151;
        }
        
        .sports-calendar .rbc-date-cell {
          padding: 8px;
          transition: background-color 0.2s;
        }
        
        .sports-calendar .rbc-date-cell:hover {
          background: #fef3e2;
        }
        
        .sports-calendar .rbc-date-cell.rbc-selected {
          background: #fed7aa;
        }
        
        .sports-calendar .rbc-date-cell.rbc-off-range {
          color: #9ca3af;
          background: #f9fafb;
        }
        
        .sports-calendar .rbc-today {
          background: #fef3e2;
          font-weight: 600;
        }
        
        .sports-calendar .rbc-slot-selection {
          background: rgba(249, 115, 22, 0.1);
          border: 2px solid #f97316;
        }
        
        .sports-calendar .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        
        .sports-calendar .rbc-timeslot-group {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .sports-calendar .rbc-current-time-indicator {
          background: #dc2626;
          height: 2px;
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        allDayAccessor={() => false}
        style={{ height }}
        view={currentView}
        date={currentDate}
        onView={setCurrentView}
        onNavigate={setCurrentDate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        selectable
        popup
        showMultiDayTimes
        step={30}
        timeslots={2}
        messages={messages}
        formats={formats}
        toolbar={showToolbar}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        min={moment().hour(8).minute(0).toDate()}
        max={moment().hour(24).minute(0).toDate()}
        dayLayoutAlgorithm="no-overlap"
      />
    </div>
  );
};

export default React.memo(CalendarComponent); 