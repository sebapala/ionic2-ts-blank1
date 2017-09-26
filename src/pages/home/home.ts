import { Component } from '@angular/core';

import { AlertController, LoadingController, NavController, Platform } from 'ionic-angular';
import { Geolocation, Keyboard } from 'ionic-native';
import { weather } from '../../providers/weather';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {

    degreeStr: string = ' degrees (C)';
    //an empty object (for now) to store our location data passed to the API
    currentLoc: any = {};
    //current weather items array
    c_items: Array<any> = [];
    //Mapped to the search field 
    searchInput: string = '';

    constructor(public alertController: AlertController, public loadingCtrl: LoadingController, public platform: Platform, public weather: weather, public navCtrl: NavController) {

    }

    ionViewDidLoad() {
        //Once the main view loads
        //and after the platform is ready...
        this.platform.ready().then(() => {
            //Setup a resume event listener
            document.addEventListener('resume', () => {
                //Get the local weather when the app resumes
                this.getLocalWeather();
            });
            //Populate the form with the current location data
            this.getLocalWeather();
        });
    }

    refreshPage() {
        this.showCurrent();
    }

    getLocalWeather() {
        let locOptions = {
            'maximumAge': 3000,
            'timeout': 5000, 'enableHighAccuracy': true
        };
        Geolocation.getCurrentPosition(locOptions).then(pos => {
            //Store our location object for later use
            this.currentLoc = { 'lat': pos.coords.latitude, 'long': pos.coords.longitude };
            //and ask for the weather for the current location
            this.showCurrent();
        }).catch(e => {
            console.error('Unable to determine current location');
            if (e) { console.log('%s: %s', e.code, e.message); console.dir(e); }
        })
    }

    showCurrent() {
        //clear out the previous array contents
        this.c_items = [];
        //Create the loading indicator
        let loader = this.loadingCtrl.create({ content: "Retrieving current conditions..." });
        //Show the loading indicator
        loader.present();
        this.weather.getCurrent(this.currentLoc).then(data => {
            //Hide the loading indicator
            loader.dismiss();
            //Now, populate the array with data from the weather service
            if (data) {
                //We have data, so lets do something with it
                this.c_items = this.formatWeatherData(data);
            } else {
                //This really should never happen
                console.error('Error retrieving weather data: Data object is empty');
            }
        }, error => {
            //Hide the loading indicator
            loader.dismiss();
            console.error('Error retrieving weather data');
            console.dir(error);
            this.showAlert(error);
        });
    }

    private formatWeatherData(data): any {
        //create a blank array to hold our results
        let tmpArray = [];
        //Add the weather data values to the array
        if (data.name) {
            //Location name will only be available for current conditions
            tmpArray.push({ 'name': 'Location', 'value': data.name });
        }
        tmpArray.push({ 'name': 'Temperature', 'value': data.main.temp + this.degreeStr });
        tmpArray.push({ 'name': 'Low', 'value': data.main.temp_min + this.degreeStr });
        tmpArray.push({ 'name': 'High', 'value': data.main.temp_max + this.degreeStr });
        tmpArray.push({ 'name': 'Humidity', 'value': data.main.humidity + '%' });
        tmpArray.push({ 'name': 'Pressure', 'value': data.main.pressure + ' hPa' });
        tmpArray.push({ 'name': 'Wind', 'value': data.wind.speed + ' mph' });
        //Do we have visibility data?
        if (data.visibility) {
            tmpArray.push({ 'name': 'Visibility', 'value': data.visibility + ' meters' });
        }
        //do we have sunrise/sunset data?
        if (data.sys.sunrise) {
            var sunriseDate = new Date(data.sys.sunrise * 1000);
            tmpArray.push({ 'name': 'Sunrise', 'value': sunriseDate.toLocaleTimeString() });
        }
        if (data.sys.sunset) {
            var sunsetDate = new Date(data.sys.sunset * 1000);
            tmpArray.push({ 'name': 'Sunset', 'value': sunsetDate.toLocaleTimeString() });
        }
        //Do we have a coordinates object? only if we passed it in on startup
        if (data.coord) {
            //Then grab long and lat
            tmpArray.push({ 'name': 'Latitude', 'value': data.coord.lat });
            tmpArray.push({ 'name': 'Longitude', 'value': data.coord.lon });
        }
        //Return the new array to the calling function
        return tmpArray;
    }

    showAlert(message: string) {
        let alert = this.alertController.create({ title: 'Error', subTitle: 'Source: Weather Service', message: message, buttons: [{ text: 'Sorry' }] });
        alert.present();
    }


    setZipCode() {
        //whenever the user enters a zip code, replace the current location 
        //with the entered value, then show current weather for the selected 
        //location. 
        //Hide the keyboard if it's open, just in case 
        Keyboard.close();
        //Populate the currentLoc variable with the city name 
        if (Number(this.searchInput) == NaN) {
            this.currentLoc = { 'zip': this.searchInput };
        }
        else {
            this.currentLoc = { 'cityName': this.searchInput };
        }
        //Clear the Zip Code input field 
        this.searchInput = '';
        //get the weather for the specified city 
        this.showCurrent();
    }

}
