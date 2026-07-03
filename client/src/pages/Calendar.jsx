import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Design System
import Card from '../design-system/Card.jsx';
import Typography from '../design-system/Typography.jsx';
import Button from '../design-system/Button.jsx';
import Badge from '../design-system/Badge.jsx';
import Icons from '../design-system/Icons.jsx';
import PageLayout from '../layouts/PageLayout.jsx';

// APIs
import { getTasksApi } from '../api/task.api.js';
import { getLeavesApi } from '../api/leave.api.js';

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 1. Fetch Tasks (limit 500)
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'calendar'],
    queryFn: () => getTasksApi({ limit: 500 })
  });

  // 2. Fetch Leaves
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves', 'calendar'],
    queryFn: () => getLeavesApi()
  });

  const tasks = tasksData?.tasks || [];
  const leaves = leavesData?.leaves || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get month details
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Fill leading empty cells (previous month overlap)
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }

  // Fill actual month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Fill trailing empty cells to make a complete week row (multiple of 7)
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  while (calendarDays.length < totalCells) {
    calendarDays.push(null);
  }

  // Get events on a specific day
  const getEventsForDay = (date) => {
    if (!date) return [];
    
    const dayStr = date.toDateString();
    const dayEvents = [];

    // Filter Tasks due on this day
    tasks.forEach(t => {
      const taskDue = new Date(t.dueDate).toDateString();
      if (taskDue === dayStr) {
        dayEvents.push({
          id: t._id,
          title: `Task: ${t.title.split('#')[0]}`,
          type: 'task',
          colorClass: 'bg-ws-primary text-white'
        });
      }
    });

    // Filter Leaves overlapping this day (only approved/pending)
    leaves.forEach(l => {
      if (l.status === 'Rejected') return;
      const start = new Date(l.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(l.endDate);
      end.setHours(23,59,59,999);
      
      if (date >= start && date <= end) {
        dayEvents.push({
          id: l._id,
          title: `${l.employee?.name || 'Employee'} (${l.type})`,
          type: 'leave',
          colorClass: l.status === 'Approved' ? 'bg-ws-success text-white' : 'bg-ws-accent-light text-ws-accent-dark border border-ws-accent'
        });
      }
    });

    return dayEvents;
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const loading = tasksLoading || leavesLoading;

  return (
    <PageLayout
      title="Company Calendar"
      description="Consolidated schedules mapping task deadlines, project targets, and employee leaves."
      loading={loading}
    >
      <Card className="p-4 border border-light shadow-sm">
        {/* Month Header Controller */}
        <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
          <Typography variant="h3" className="mb-0 text-dark">
            {monthNames[month]} {year}
          </Typography>
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={prevMonth}
              icon={<Icons.ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />}
            >
              Prev
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={nextMonth}
              icon={<Icons.ChevronRight size={14} />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="d-flex flex-column">
          {/* Weekday headers */}
          <div className="row text-center fw-bold fs-8 text-muted text-uppercase mb-2">
            {daysOfWeek.map(d => (
              <div key={d} className="col py-2 bg-light border-bottom" style={{ flex: '0 0 14.2857%', maxWidth: '14.2857%' }}>{d}</div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="row g-0 border-start border-top" style={{ minHeight: '500px' }}>
            {calendarDays.map((date, idx) => {
              const events = getEventsForDay(date);
              const isToday = date && date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  className={`col border-end border-bottom p-2 d-flex flex-column gap-1.5 align-items-start ${!date ? 'bg-light opacity-50' : ''}`}
                  style={{ flex: '0 0 14.2857%', maxWidth: '14.2857%', height: '110px', overflowY: 'auto' }}
                >
                  {date && (
                    <div className="d-flex justify-content-between align-items-center w-100 mb-1">
                      <span className={`fw-bold fs-7 ${isToday ? 'bg-ws-primary text-white rounded-circle d-flex align-items-center justify-content-center' : 'text-dark'}`} style={isToday ? { width: '24px', height: '24px' } : {}}>
                        {date.getDate()}
                      </span>
                    </div>
                  )}
                  {date && events.map((ev, i) => (
                    <div
                      key={i}
                      className={`fs-9 py-0.5 px-1.5 rounded-1 w-100 text-truncate fw-medium`}
                      title={ev.title}
                      style={{ cursor: 'default', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      <span className={`badge ${ev.colorClass} w-100 text-start text-truncate`}>{ev.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
      
      {/* Legend */}
      <div className="d-flex gap-4 mt-3 justify-content-center fs-8 text-muted fw-medium">
        <div className="d-flex align-items-center gap-1.5">
          <div style={{ width: '12px', height: '12px', borderRadius: '3px' }} className="bg-ws-primary"></div>
          <span>Task Deadlines</span>
        </div>
        <div className="d-flex align-items-center gap-1.5">
          <div style={{ width: '12px', height: '12px', borderRadius: '3px' }} className="bg-ws-success"></div>
          <span>Approved Leave Time</span>
        </div>
        <div className="d-flex align-items-center gap-1.5">
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1px solid var(--ws-accent)' }} className="bg-ws-accent-light"></div>
          <span>Pending Leave Applications</span>
        </div>
      </div>
    </PageLayout>
  );
};

export default Calendar;
