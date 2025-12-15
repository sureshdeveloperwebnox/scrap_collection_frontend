'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dayjs, { Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateTimePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showTime?: boolean;
}

export function DateTimePicker({
  date,
  onDateChange,
  disabled = false,
  placeholder = 'Pick a date and time',
  className,
  showTime = true,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(
    date ? dayjs(date) : null
  );
  const [selectedTime, setSelectedTime] = React.useState<Dayjs | null>(
    date ? dayjs(date) : null
  );
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (date) {
      const dayjsDate = dayjs(date);
      setSelectedDate(dayjsDate);
      setSelectedTime(dayjsDate);
    } else {
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [date]);

  const handleDateChange = (newDate: Dayjs | null) => {
    setSelectedDate(newDate);
    
    if (newDate && selectedTime) {
      // Combine date and time
      const combined = newDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0)
        .millisecond(0);
      onDateChange(combined.toDate());
    } else if (newDate) {
        // If no time is set, use current time
      const now = dayjs();
      const combined = newDate
        .hour(now.hour())
        .minute(now.minute())
        .second(0)
        .millisecond(0);
      setSelectedTime(combined);
      onDateChange(combined.toDate());
    } else {
      onDateChange(undefined);
    }
  };

  const handleTimeChange = (newTime: Dayjs | null) => {
    setSelectedTime(newTime);
    
    if (newTime) {
      const baseDate = selectedDate || dayjs();
      const combined = baseDate
        .hour(newTime.hour())
        .minute(newTime.minute())
        .second(0)
        .millisecond(0);
      
      if (!selectedDate) {
        setSelectedDate(combined);
      }
      onDateChange(combined.toDate());
    } else if (selectedDate) {
      // If time is cleared but date exists, reset time to midnight
      const combined = selectedDate.hour(0).minute(0).second(0).millisecond(0);
      onDateChange(combined.toDate());
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    onDateChange(undefined);
    setIsOpen(false);
  };

  const handleDone = () => {
    if (selectedDate && selectedTime) {
      const combined = selectedDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0)
        .millisecond(0);
      onDateChange(combined.toDate());
    } else if (selectedDate) {
      const now = dayjs();
      const combined = selectedDate
        .hour(now.hour())
        .minute(now.minute())
        .second(0)
        .millisecond(0);
      onDateChange(combined.toDate());
    }
    setIsOpen(false);
  };

  const displayDate = selectedDate ? selectedDate.toDate() : undefined;
  const displayTime = selectedTime ? selectedTime.format('HH:mm') : '';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={cn('relative w-full', className)}>
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
              type="button"
          variant="outline"
          disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
          className={cn(
            'h-12 w-full justify-start text-left font-normal rounded-xl border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all',
                !displayDate && 'text-muted-foreground'
          )}
        >
          <div className="flex items-center gap-2 w-full">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="flex-1 text-left">
                  {displayDate ? (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                        {format(displayDate, 'PPP')}
                  </span>
                      {showTime && displayTime && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                          {displayTime}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">{placeholder}</span>
              )}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-white border-gray-200 shadow-xl rounded-xl z-[100]"
            align="start"
            sideOffset={8}
            side="bottom"
            avoidCollisions={true}
            collisionPadding={16}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              // Allow clicks on MUI picker elements
              if (target.closest('.MuiPickersDay-root') || 
                  target.closest('.MuiClock-root') || 
                  target.closest('.MuiClock-meridiemText') ||
                  target.closest('.MuiPickersCalendarHeader-root')) {
                return;
              }
              if (target.closest('[role="dialog"]')) {
                e.preventDefault();
              }
            }}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="p-4 min-w-[320px] max-w-[400px] max-h-[85vh] overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: 'contain' }}>
              <div className="space-y-4">
                <div style={{ pointerEvents: 'auto' }}>
                  <StaticDatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabled={disabled}
                    displayStaticWrapperAs="desktop"
                    orientation="portrait"
                    reduceAnimations
                    slotProps={{
                      actionBar: {
                        actions: [],
                      },
                    }}
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      '& .MuiPickersCalendarHeader-root': {
                        paddingLeft: '0.5rem',
                        paddingRight: '0.5rem',
                        marginBottom: '0.5rem',
                      },
                      '& .MuiPickersCalendarHeader-labelContainer': {
                        marginLeft: '0.5rem',
                        marginRight: '0.5rem',
                      },
                      '& .MuiDayCalendar-root': {
                        width: '100%',
                      },
                      '& .MuiPickersDay-root': {
                        borderRadius: '0.375rem',
                        margin: '0.125rem',
                        width: '2.25rem',
                        height: '2.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        '&.Mui-selected': {
                          backgroundColor: '#06b6d4',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#0891b2',
                          },
                        },
                        '&:hover': {
                          backgroundColor: '#e0f7fa',
                        },
                        '&.Mui-disabled': {
                          cursor: 'not-allowed',
                        },
                      },
                      '& .MuiPickersDay-today': {
                        border: '1px solid #06b6d4',
                        backgroundColor: '#e0f7fa',
                        fontWeight: 600,
                      },
                      '& .MuiPickersCalendarHeader-switchViewButton': {
                        display: 'none',
                      },
            }}
          />
                </div>

          {showTime && (
                  <div className="border-t border-gray-200 pt-4" style={{ pointerEvents: 'auto' }}>
                    <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-cyan-600" />
                      <label className="text-sm font-medium text-gray-700">Time</label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Hour Dropdown */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Hour</label>
                        <Select
                          value={selectedTime ? selectedTime.format('h') : '12'}
                          onValueChange={(value) => {
                            const hour = parseInt(value);
                            const currentHour = selectedTime ? selectedTime.hour() : 0;
                            const isPM = currentHour >= 12;
                            const newHour = isPM ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
                            const newTime = (selectedTime || dayjs()).hour(newHour).minute(selectedTime?.minute() || 0);
                            handleTimeChange(newTime);
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[110]" position="popper">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                              <SelectItem key={hour} value={hour.toString()}>
                                {hour.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Minute Dropdown */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Minute</label>
                        <Select
                          value={selectedTime ? selectedTime.format('mm') : '00'}
                          onValueChange={(value) => {
                            const minute = parseInt(value);
                            const newTime = (selectedTime || dayjs()).minute(minute);
                            handleTimeChange(newTime);
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[110] max-h-[200px]" position="popper">
                            {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                              <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                                {minute.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* AM/PM Dropdown */}
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Period</label>
                        <Select
                          value={selectedTime ? (selectedTime.hour() >= 12 ? 'PM' : 'AM') : 'AM'}
                          onValueChange={(value) => {
                            const isPM = value === 'PM';
                            const currentHour = selectedTime ? selectedTime.hour() : 0;
                            const hour12 = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
                            const newHour = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
                            const newTime = (selectedTime || dayjs()).hour(newHour).minute(selectedTime?.minute() || 0);
                            handleTimeChange(newTime);
                          }}
                disabled={disabled}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[110]" position="popper">
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
            </div>
          )}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
                    type="button"
              variant="outline"
              size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClear();
              }}
              className="h-9 px-4 rounded-lg"
            >
              Clear
            </Button>
            <Button
                    type="button"
              size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDone();
              }}
              className="h-9 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Done
            </Button>
                </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
      </div>
    </LocalizationProvider>
  );
}
