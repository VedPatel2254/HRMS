import { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, MapPin, Loader2 } from 'lucide-react';

interface Session {
  punchIn: string | null;
  punchOut: string | null;
  workingHours: number | null;
}

interface PunchWidgetProps {
  todayAttendance: {
    punchIn: string | null;
    punchOut: string | null;
    workingHours: number | null;
    status: string;
    sessions?: Session[];
  } | null;
  onPunchIn: (lat?: number, long?: number) => Promise<void>;
  onPunchOut: (lat?: number, long?: number) => Promise<void>;
}

const PunchWidget = ({ todayAttendance, onPunchIn, onPunchOut }: PunchWidgetProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasPunchedIn = !!todayAttendance?.punchIn;
  const hasPunchedOut = !!todayAttendance?.punchOut;
  const isActive = hasPunchedIn && !hasPunchedOut;
  const sessions = todayAttendance?.sessions || [];
  const totalHours = todayAttendance?.workingHours || 0;

  const getLocation = (): Promise<{ lat?: number; long?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationStatus('Geolocation not supported');
        resolve({});
        return;
      }

      setLocationStatus('Getting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationStatus('Location captured');
          resolve({
            lat: position.coords.latitude,
            long: position.coords.longitude,
          });
        },
        () => {
          setLocationStatus('Location denied');
          resolve({});
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handlePunchIn = async () => {
    setIsLoading(true);
    try {
      const location = await getLocation();
      await onPunchIn(location.lat, location.long);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setIsLoading(true);
    try {
      const location = await getLocation();
      await onPunchOut(location.lat, location.long);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center">
        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {currentTime.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white font-mono mt-2">
            {currentTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}
          </p>
        </div>

        {isActive && (
          <div className="mb-4 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <LogIn className="w-4 h-4" />
              <span>In: {formatTime(todayAttendance!.punchIn!)}</span>
            </div>
          </div>
        )}

        {hasPunchedOut && totalHours > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 text-accent text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>Total: {totalHours.toFixed(1)}h today ({sessions.length} session{sessions.length !== 1 ? 's' : ''})</span>
            </div>
          </div>
        )}

        {sessions.length > 1 && (
          <div className="mb-4 space-y-1">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-center gap-3 text-xs text-gray-500">
                <span>Session {sessions.length - i}:</span>
                {s.punchIn && <span className="text-green-600">In {formatTime(s.punchIn)}</span>}
                {s.punchOut && <span className="text-red-600">Out {formatTime(s.punchOut)}</span>}
                {s.workingHours != null && <span>{s.workingHours.toFixed(1)}h</span>}
              </div>
            ))}
          </div>
        )}

        {locationStatus && (
          <div className="mb-4 flex items-center justify-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{locationStatus}</span>
          </div>
        )}

        {!hasPunchedIn ? (
          <button
            onClick={handlePunchIn}
            disabled={isLoading}
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-green-600/25"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
            Punch In
          </button>
        ) : isActive ? (
          <button
            onClick={handlePunchOut}
            disabled={isLoading}
            className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-red-600/25"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <LogOut className="w-6 h-6" />
            )}
            Punch Out
          </button>
        ) : (
          <button
            onClick={handlePunchIn}
            disabled={isLoading}
            className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-green-600/25"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
            Punch In Again
          </button>
        )}
      </div>
    </div>
  );
};

export default PunchWidget;
