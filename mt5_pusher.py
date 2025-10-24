# هذا السكربت مخصص للتشغيل على جهاز يوجد به MT5 terminal
# يتطلب تثبيت المكتبات: MetaTrader5, pandas, requests
import time
try:
    import MetaTrader5 as mt5
except Exception as e:
    print("مكتبة MetaTrader5 غير مثبتة أو غير متاحة في هذا البيئة:", e)
import requests
import pandas as pd
from datetime import datetime

MT5_SYMBOL = 'XAUUSD'
SERVER_HTTP = 'http://YOUR_SERVER_DOMAIN_OR_IP:8000/push_signal'  # عدّل هذا العنوان عند النشر

def ema(series, period):
    return series.ewm(span=period, adjust=False).mean()

def macd_signal(df, fast=8, slow=17, signal=5):
    fast_ema = ema(df['close'], fast)
    slow_ema = ema(df['close'], slow)
    macd_line = fast_ema - slow_ema
    sig = ema(macd_line, signal)
    hist = macd_line - sig
    return macd_line, sig, hist

def williams_r(df, period=9):
    highest = df['high'].rolling(period).max()
    lowest = df['low'].rolling(period).min()
    wr = -100 * (highest - df['close']) / (highest - lowest)
    return wr

# if not mt5.initialize():
#     print('Failed to init MT5')
#     mt5.shutdown()
#     raise SystemExit

# Simulated loop (for testing without MT5)
if __name__ == '__main__':
    print('mt5_pusher placeholder script. When running on a machine with MT5, uncomment initialization and use real server URL.')
    while False:
        time.sleep(1)
