import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';

const CAMERA_URL = 'http://192.168.42.1';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Pritisni "Provjeri vezu" za početak');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useKeepAwake();

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  useEffect(() => {
    if (isRecording) {
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const sendCommand = async (commandName, params = {}) => {
    const res = await fetch(`${CAMERA_URL}/osc/commands/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: commandName, parameters: params }),
    });
    return res.ok;
  };

  const checkConnection = async () => {
    setLoading(true);
    setStatus('Provjerava vezu...');
    try {
      const res = await fetch(`${CAMERA_URL}/osc/info`);
      if (res.ok) {
        const data = await res.json();
        setStatus(`Spojen: ${data.model ?? 'Insta360 X3'}`);
      } else {
        setStatus('Kamera nije odgovorila');
      }
    } catch {
      setStatus('Kamera nije dostupna.\nSpoji se na WiFi kamere.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setLoading(true);
    setStatus('Postavljam video mod...');
    try {
      await sendCommand('camera.setOptions', { options: { captureMode: 'video' } });
      setStatus('Pokretanje snimanja...');
      const ok = await sendCommand('camera.startCapture');
      if (ok) {
        setIsRecording(true);
        setStatus('Snimanje u tijeku');
      } else {
        setStatus('Nije uspjelo');
      }
    } catch {
      setStatus('Kamera nije dostupna');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    setLoading(true);
    setStatus('Zaustavljanje...');
    try {
      const ok = await sendCommand('camera.stopCapture');
      if (ok) {
        setIsRecording(false);
        setStatus('Snimanje zaustavljeno');
      } else {
        setStatus('Greška pri zaustavljanju');
      }
    } catch {
      setStatus('Kamera nije dostupna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Jura's APP</Text>

      <View style={styles.statusBox}>
        {isRecording && (
          <Text style={styles.timer}>{formatTime(seconds)}</Text>
        )}
        <Text style={[styles.statusText, isRecording && styles.statusRecording]}>
          {status}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e00" style={styles.bigButton} />
      ) : isRecording ? (
        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
          <View style={styles.stopSquare} />
          <Text style={styles.stopLabel}>ZAUSTAVI</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.recButton} onPress={startRecording}>
          <View style={styles.recDot} />
          <Text style={styles.recLabel}>SNIMI</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.connectButton}
        onPress={checkConnection}
        disabled={loading}
      >
        <Text style={styles.connectLabel}>Provjeri vezu s kamerom</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  statusBox: {
    minHeight: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  timer: {
    color: '#f44',
    fontSize: 36,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  statusText: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusRecording: {
    color: '#f44',
  },
  bigButton: {
    width: 180,
    height: 180,
  },
  recButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#cc0000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 8,
  },
  recDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  recLabel: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  stopButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#1a1a1a',
    borderWidth: 4,
    borderColor: '#cc0000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 8,
  },
  stopSquare: {
    width: 40,
    height: 40,
    backgroundColor: '#cc0000',
    borderRadius: 6,
  },
  stopLabel: {
    color: '#cc0000',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  connectButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  connectLabel: {
    color: '#555',
    fontSize: 14,
  },
});
