{
    "readable": false
}

// Fetch weather information and return as HTML.
res.statusCode = 200;
res.setHeader("Content-Type", "text/html");

const url = 'https://api.openweathermap.org/data/3.0/onecall?lat=35.0844&lon=-106.6504&appid=1eda175d5a74deacbc02b1ce2159f89c&units=imperial&exclude=minutely,daily';
const response = await fetch(url);
/**
 * @type {import("./OneCallWeatherResponse").OneCallWeatherResponse}
 */
const weatherJSON = await response.json();

const result = JSON.stringify({ successful: true, time: new Date(Date.now()).toString().split(" ").slice(0, 4).join(" "), weather: weatherJSON.current, hourlyPrediction: weatherJSON.hourly });

res.end(`<html><script>parent.handleResponse(${result})</script>Here's some visible text.</html>`);