const OPENWEATHER_KEY = '';
const DB_NAME = 'pwa-weather';
const STORE = 'cities';
let db;

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'name' });
      }
    };
    req.onsuccess = () => { db = req.result; res(); };
    req.onerror = () => rej(req.error);
  });
}

async function addCity(name) {
  await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ name });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function getCities() {
  await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result.map(c => c.name));
    req.onerror = () => rej(tx.error);
  });
}

if (document.getElementById('city-form')) {
  document.getElementById('city-form').addEventListener('submit', async e => {
    e.preventDefault();
    const nameEl = document.getElementById('city-name');
    const status = document.getElementById('form-status');
    const name = nameEl.value.trim();
    if (!name) return;
    try {
      await addCity(name);
      status.textContent = 'Zapisano!';
      nameEl.value = '';
      setTimeout(() => status.textContent = '', 2000);
    } catch {
      status.textContent = 'Błąd zapisu.';
    }
  });
}

if (document.getElementById('get-weather')) {
  const sel = document.getElementById('saved-cities');
  const btn = document.getElementById('get-weather');

  getCities().then(list => {
    if (!list.length) {
      sel.innerHTML = '<option>— brak zapisanych miast —</option>';
      btn.disabled = true;
    } else {
      sel.innerHTML = list.map(c => `<option>${c}</option>`).join('');
      btn.disabled = false;
    }
  });

  btn.addEventListener('click', () => {
    const city = sel.value;
    if (city) fetchWeather(city);
  });
}

async function fetchWeather(city) {
  const disp = document.getElementById('city-display');
  const tEl = document.getElementById('w-temp');
  const dEl = document.getElementById('w-desc');
  const timeEl = document.getElementById('w-time');
  const iconEl = document.getElementById('w-icon');
  const hEl = document.getElementById('w-humidity');
  const pEl = document.getElementById('w-pressure');
  const wsEl = document.getElementById('w-wind-speed');
  const wdEl = document.getElementById('w-wind-dir');
  const cEl = document.getElementById('w-clouds');
  const vEl = document.getElementById('w-vis');
  const info = document.getElementById('weather-info');

  info.classList.add('hidden');

  try {
    const data = await fetch(
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(city)}` +
      `&units=metric&lang=pl&appid=${OPENWEATHER_KEY}`
    ).then(r => r.json());
    if (data.cod !== 200) throw new Error(data.message);

    disp.textContent = data.name;
    tEl.textContent = data.main.temp.toFixed(1);
    dEl.textContent = data.weather[0].description;
    timeEl.textContent = new Date().toLocaleString('pl-PL');
    iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    iconEl.alt = data.weather[0].description;

    hEl.textContent = data.main.humidity;
    pEl.textContent = data.main.pressure;
    wsEl.textContent = data.wind.speed.toFixed(1);
    wdEl.textContent = data.wind.deg;
    cEl.textContent = data.clouds.all;
    vEl.textContent = (data.visibility / 1000).toFixed(1);

    info.classList.remove('hidden');
  } catch (e) {
    alert('Nie udało się pobrać pogody: ' + e.message);
  }
}

if (document.getElementById('get-forecast')) {
  const sel = document.getElementById('saved-cities');
  const btn = document.getElementById('get-forecast');
  const container = document.getElementById('forecast-container');
  const tmpl = document.getElementById('forecast-card-template');

  getCities().then(list => {
    if (!list.length) {
      sel.innerHTML = '<option>— brak zapisanych miast —</option>';
      btn.disabled = true;
    } else {
      sel.innerHTML = list.map(c => `<option>${c}</option>`).join('');
      btn.disabled = false;
    }
  });

  btn.addEventListener('click', () => {
    const city = sel.value;
    if (city) fetchForecast(city);
  });
}

async function fetchForecast(city) {
  const container = document.getElementById('forecast-container');
  const tmpl = document.getElementById('forecast-card-template');
  container.innerHTML = '';
  container.classList.remove('hidden');

  try {
    const loc = await fetch(
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(city)}` +
      `&appid=${OPENWEATHER_KEY}`
    ).then(r => r.json());
    if (loc.cod !== 200) throw new Error(loc.message);
    const cityId = loc.id;

    const data = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast` +
      `?id=${cityId}` +
      `&units=metric&lang=pl&appid=${OPENWEATHER_KEY}`
    ).then(r => r.json());
    if (data.cod !== '200' || !Array.isArray(data.list)) {
      throw new Error(data.message || 'Błędna odpowiedź API');
    }

    const daily = data.list
      .filter(item => item.dt_txt.endsWith('12:00:00'))
      .slice(0, 5);

    daily.forEach(day => {
      const clone = tmpl.content.cloneNode(true);
      const dateStr = new Date(day.dt * 1000).toLocaleDateString('pl-PL', {
        weekday: 'long', day: 'numeric', month: 'long'
      });

      clone.querySelector('.fc-date').textContent = dateStr;
      clone.querySelector('.weather-icon').src =
        `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
      clone.querySelector('.weather-icon').alt = day.weather[0].description;
      clone.querySelector('.fc-temp').textContent = Math.round(day.main.temp);
      clone.querySelector('.fc-desc').textContent = day.weather[0].description;
      clone.querySelector('.fc-humidity').textContent = day.main.humidity;
      clone.querySelector('.fc-pressure').textContent = day.main.pressure;
      clone.querySelector('.fc-wind-speed').textContent = day.wind.speed.toFixed(1);
      clone.querySelector('.fc-clouds').textContent = day.clouds.all;

      container.appendChild(clone);
    });

  } catch (e) {
    alert('Nie udało się pobrać prognozy: ' + e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
});