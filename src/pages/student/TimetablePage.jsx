import React, { useState } from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { TIMETABLE_DATA } from '../../data/mockAcademics';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';

export default function TimetablePage() {
  const [selectedDay, setSelectedDay] = useState('All');

  const visibleDays =
    selectedDay === 'All' ? TIMETABLE_DATA : TIMETABLE_DATA.filter((d) => d.day === selectedDay);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Weekly & Daily Schedule"
        title="Accessible Class Timetable"
        description="Includes ground-floor/ramp room indicators, caption-equipped halls, and UDAAN mentorship slots."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter timetable by day">
        {['All', ...TIMETABLE_DATA.map((d) => d.day)].map((day) => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={selectedDay === day}
            onClick={() => setSelectedDay(day)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedDay === day
                ? 'bg-royal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {visibleDays.map((dayObj) => (
          <section key={dayObj.day} className="card-surface p-5">
            <h2 className="text-base font-extrabold text-navy-950 dark:text-white mb-4">
              {dayObj.day}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayObj.slots.map((slot, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-royal-600 dark:text-royal-400">{slot.code}</span>
                    <Badge variant={slot.type === 'Mentorship' ? 'violet' : slot.type === 'Support' ? 'warning' : 'info'}>
                      {slot.type}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{slot.subject}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" /> {slot.time}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {slot.room}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 shrink-0" /> {slot.faculty}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
