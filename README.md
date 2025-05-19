# Weather App ☁️🌦️🚀

Weather App is a responsive Progressive Web Application that delivers real-time weather information for multiple cities.
## Features

- 📡 **Offline mode**  
  Caches static assets and dynamic API responses using Service Worker strategies (cache-first, network-first, and stale-while-revalidate), with an `offline.html` fallback.

- 💾 **Local storage**  
  Uses IndexedDB to store a list of favorite cities, ensuring data persistence across sessions and offline availability.

- 📱 **PWA features**  
  Includes a fully configured `manifest.json` for installation on desktops and mobile devices, with customizable icons and theme colors.

> **Note:** To fetch weather data, you need an OpenWeatherMap API key.  
> Set the environment variable `OPENWEATHER_KEY` before building or running the app.

## Getting Started
1. Clone the repository
2. Install a static server (e.g., serve) ```npm install --global serve```
3. Set your OpenWeather API key
4. Build and serve ```serve . ```

## Screenshots

![image](https://github.com/user-attachments/assets/9997e0ff-5d06-4c09-9c45-93b504096e7c)
![image](https://github.com/user-attachments/assets/b2fd4937-bcc7-4099-bd72-08eba1d42825)

