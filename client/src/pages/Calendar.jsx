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
  const [selectedDate, setSelectedDate] = useState(null);

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
          colorClass: 'bg-ws-primary text-white',
          raw: t
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
          colorClass: l.status === 'Approved' ? 'bg-ws-success text-white' : 'bg-ws-accent-light text-ws-accent-dark border border-ws-accent',
          raw: l
        });
      }
    });

    // Sort dayEvents: Approved Leaves should show first (above tasks/pending leaves), then Pending Leaves, then Tasks
    dayEvents.sort((a, b) => {
      const isApprovedLeaveA = a.type === 'leave' && a.raw.status === 'Approved';
      const isApprovedLeaveB = b.type === 'leave' && b.raw.status === 'Approved';
      
      if (isApprovedLeaveA && !isApprovedLeaveB) return -1;
      if (!isApprovedLeaveA && isApprovedLeaveB) return 1;
      
      // Place any leaves before tasks
      if (a.type === 'leave' && b.type === 'task') return -1;
      if (a.type === 'task' && b.type === 'leave') return 1;
      
      return 0;
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
          <div className="row g-0 border-start border-top animate-fadeIn" style={{ minHeight: '520px' }}>
            {calendarDays.map((date, idx) => {
              const events = getEventsForDay(date);
              const isToday = date && date.toDateString() === new Date().toDateString();
              
              const limit = 2;
              const visibleEvents = events.slice(0, limit);
              const remainingCount = events.length - limit;

              return (
                <div
                  key={idx}
                  onClick={() => date && setSelectedDate(date)}
                  className={`col border-end border-bottom p-2 d-flex flex-column gap-1.5 align-items-start ${
                    !date ? 'bg-light opacity-50' : 'hover-bg-light cursor-pointer transition-all'
                  }`}
                  style={{ 
                    flex: '0 0 14.2857%', 
                    maxWidth: '14.2857%', 
                    height: '115px', 
                    overflow: 'hidden',
                    transition: 'background-color 0.15s ease-in-out'
                  }}
                >
                  {date && (
                    <div className="d-flex justify-content-between align-items-center w-100 mb-1">
                      <span 
                        className={`fw-bold fs-7 d-flex align-items-center justify-content-center ${
                          isToday ? 'bg-ws-primary text-white rounded-circle' : 'text-dark'
                        }`} 
                        style={isToday ? { width: '24px', height: '24px' } : {}}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                  )}
                  {date && visibleEvents.map((ev, i) => (
                    <div
                      key={i}
                      className="fs-9 w-100 text-truncate"
                      title={ev.title}
                    >
                      <span className={`badge ${ev.colorClass} w-100 text-start text-truncate fw-semibold`}>
                        {ev.title}
                      </span>
                    </div>
                  ))}
                  {date && remainingCount > 0 && (
                    <div className="fs-9 text-ws-primary fw-bold mt-1 text-center w-100 font-heading">
                      + {remainingCount} more
                    </div>
                  )}
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

      {/* Date Details Modal */}
      {selectedDate && (
        <>
          <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-md" role="document">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="modal-header bg-ws-primary text-white border-0 py-3 px-4">
                  <h5 className="modal-title font-heading fw-bold fs-6">
                    Schedule for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white border-0 shadow-none"
                    aria-label="Close"
                    onClick={() => setSelectedDate(null)}
                  ></button>
                </div>
                <div className="modal-body p-4" style={{ backgroundColor: '#f8f9fa', maxHeight: '420px', overflowY: 'auto' }}>
                  {(() => {
                    const dayEvents = getEventsForDay(selectedDate);
                    const dayTasks = dayEvents.filter(ev => ev.type === 'task');
                    const dayLeaves = dayEvents.filter(ev => ev.type === 'leave');

                    if (dayEvents.length === 0) {
                      return (
                        <div className="text-center py-5 text-muted">
                          <Icons.Menu size={36} className="mb-2 opacity-50" />
                          <p className="fs-8 mb-0">No scheduled tasks or active leaves on this date.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="d-flex flex-column gap-4 animate-fadeIn">
                        {/* Tasks Section */}
                        {dayTasks.length > 0 && (
                          <div>
                            <h6 className="font-heading fw-bold text-dark fs-8 text-uppercase tracking-wider mb-2.5 d-flex align-items-center gap-1.5">
                              <span className="bg-ws-primary" style={{ width: '4px', height: '14px', borderRadius: '2px' }}></span>
                              Tasks Due ({dayTasks.length})
                            </h6>
                            <div className="d-flex flex-column gap-2">
                              {dayTasks.map(ev => {
                                const t = ev.raw;
                                return (
                                  <div key={t._id} className="p-3 bg-white border border-light rounded-3 shadow-sm d-flex flex-column gap-1.5">
                                    <div className="d-flex align-items-start justify-content-between gap-2">
                                      <span className="fw-bold text-dark fs-7 leading-sm">{t.title.split('#')[0]}</span>
                                      <span className="badge bg-ws-primary-light text-ws-primary fs-9 py-0.5 px-2 rounded-pill">
                                        {t.status}
                                      </span>
                                    </div>
                                    <span className="text-muted fs-8 leading-sm">{t.description}</span>
                                    <div className="d-flex align-items-center justify-content-between border-top border-light pt-2 mt-1.5 fs-8 text-muted">
                                      <span>Project: <strong className="text-dark">{t.project?.name || 'General'}</strong></span>
                                      <span>Priority: <strong className="text-dark">{t.priority}</strong></span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Leaves Section */}
                        {dayLeaves.length > 0 && (
                          <div>
                            <h6 className="font-heading fw-bold text-dark fs-8 text-uppercase tracking-wider mb-2.5 d-flex align-items-center gap-1.5">
                              <span className="bg-ws-success" style={{ width: '4px', height: '14px', borderRadius: '2px' }}></span>
                              Out of Office ({dayLeaves.length})
                            </h6>
                            <div className="d-flex flex-column gap-2">
                              {dayLeaves.map(ev => {
                                const l = ev.raw;
                                const isApproved = l.status === 'Approved';
                                return (
                                  <div key={l._id} className="p-3 bg-white border border-light rounded-3 shadow-sm d-flex align-items-center justify-content-between">
                                    <div className="d-flex flex-column gap-0.5">
                                      <span className="fw-bold text-dark fs-7">{l.employee?.name || 'Employee'}</span>
                                      <span className="text-muted fs-8">{l.type} Leave ({new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()})</span>
                                    </div>
                                    <span className={`badge ${isApproved ? 'bg-ws-success' : 'bg-ws-accent-light text-ws-accent-dark'} fs-9 py-1 px-2.5 rounded-pill`}>
                                      {l.status}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="modal-footer border-0 py-2.5 px-4 bg-white justify-content-end">
                  <button
                    type="button"
                    className="btn btn-ws-secondary py-1.5 px-4 rounded-2 font-heading fw-bold fs-8"
                    onClick={() => setSelectedDate(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }} onClick={() => setSelectedDate(null)}></div>
        </>
      )}
    </PageLayout>
  );
};

export default Calendar;
