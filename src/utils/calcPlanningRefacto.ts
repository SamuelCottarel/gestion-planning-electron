import {
  format,
  eachDayOfInterval,
  parseISO,
  startOfDay,
  addHours,
} from "date-fns";
import { employees } from "./Employees";

interface Event {
  resourceId: string;
  start: string;
  end: string;
  title: string;
}

function getTimeISO(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  return format(
    addHours(startOfDay(date), hours + minutes / 60),
    "yyyy-MM-dd'T'HH:mm:ss",
  );
}

export function generateEvents(startDate: string, endDate: string): Event[] {
  const dates = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
  const events: Event[] = [];

  dates.forEach((date) => {
    const dayName = format(date, "EEEE");
    if (["Monday", "Tuesday", "Thursday", "Friday"].includes(dayName)) {
      events.push(...handleStandardDay(date, dayName));
    } else if (dayName === "Saturday" || dayName === "Sunday") {
      events.push(...handleWeekendDay(date, dayName));
    }
  });

  return events;
}

function handleStandardDay(date: Date, dayName: string): Event[] {
  const morningShifts: Event[] = [];
  const afternoonShifts: Event[] = [];

  Object.values(employees).forEach((employee) => {
    if (employee.fixedOff.includes(dayName) || employee.role !== "vendeuse") {
      return;
    }

    const startMorning = getTimeISO(date, "06:30");
    const endMorning = getTimeISO(date, "13:30");
    const startAfternoon = getTimeISO(date, "13:30");
    const endAfternoon = getTimeISO(date, "20:30");

    morningShifts.push({
      resourceId: employee.id,
      start: startMorning,
      end: endMorning,
      title: "Morning Shift",
    });
    afternoonShifts.push({
      resourceId: employee.id,
      start: startAfternoon,
      end: endAfternoon,
      title: "Afternoon Shift",
    });
  });

  const selectedEvents = [];
  // Ensure there are at least two vendeuses in the morning
  if (morningShifts.length >= 2) {
    selectedEvents.push(...morningShifts.slice(0, 2));
  }

  // Ensure there is at least one vendeuse in the afternoon
  if (afternoonShifts.length >= 1) {
    selectedEvents.push(afternoonShifts[0]);
  }

  return selectedEvents;
}

function handleWeekendDay(date: Date, dayName: string): Event[] {
  // Logic for weekends could be specific, such as reduced hours or different staff requirements
  const shifts: Event[] = [];

  Object.values(employees).forEach((employee) => {
    if (employee.fixedOff.includes(dayName)) {
      return;
    }

    const customTimes = employee.fixedTimes?.[dayName];
    if (!customTimes) {
      return; // If no custom times for weekends, assume they're not working
    }

    shifts.push({
      resourceId: employee.id,
      start: getTimeISO(date, customTimes.start),
      end: getTimeISO(date, customTimes.end),
      title: `${dayName} Shift`,
    });
  });

  return shifts;
}

// Example of usage
// const events = generateEvents('2023-10-01', '2023-10-07');
// console.log(events);
