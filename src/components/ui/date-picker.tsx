'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
    date?: Date;
    onDateChange: (date: Date | undefined) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    minDate?: Date;
    maxDate?: Date;
}

export function DatePicker({
    date,
    onDateChange,
    disabled = false,
    placeholder = 'Pick a date',
    className,
    minDate,
    maxDate,
}: DatePickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(
        date ? dayjs(date) : null
    );
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (date) {
            setSelectedDate(dayjs(date));
        } else {
            setSelectedDate(null);
        }
    }, [date]);

    const handleDateChange = (newDate: Dayjs | null) => {
        setSelectedDate(newDate);
        if (newDate) {
            onDateChange(newDate.toDate());
        } else {
            onDateChange(undefined);
        }
    };

    const handleClear = () => {
        setSelectedDate(null);
        onDateChange(undefined);
        setIsOpen(false);
    };

    const handleDone = () => {
        if (selectedDate) {
            onDateChange(selectedDate.toDate());
        }
        setIsOpen(false);
    };

    const displayDate = selectedDate ? selectedDate.toDate() : undefined;

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className={cn('relative', className)}>
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
                                'h-10 w-full justify-start text-left font-normal rounded-lg border-gray-200 bg-white hover:bg-gray-50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all',
                                !displayDate && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                            {displayDate ? (
                                <span className="text-sm font-medium text-gray-900">
                                    {format(displayDate, 'PP')}
                                </span>
                            ) : (
                                <span className="text-sm text-gray-500">{placeholder}</span>
                            )}
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
                            if (target.closest('.MuiPickersDay-root') ||
                                target.closest('.MuiPickersCalendarHeader-root')) {
                                return;
                            }
                            if (target.closest('[role="dialog"]')) {
                                e.preventDefault();
                            }
                        }}
                        style={{ pointerEvents: 'auto' }}
                    >
                        <div className="p-4 min-w-[320px]" style={{ overscrollBehavior: 'contain' }}>
                            <div className="space-y-4">
                                <div style={{ pointerEvents: 'auto' }}>
                                    <StaticDatePicker
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        disabled={disabled}
                                        minDate={minDate ? dayjs(minDate) : undefined}
                                        maxDate={maxDate ? dayjs(maxDate) : undefined}
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
