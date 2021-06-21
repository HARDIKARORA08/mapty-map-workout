'use strict';
const form=document.querySelector('.form');
const activityType=document.querySelector('.form__input--type');
const inputCadence=document.querySelector('.form__input--cadence')
const inputElevation=document.querySelector('.form__input--elevation')
const inputDistance=document.querySelector('.form__input--distance');
const inputDuration=document.querySelector('.form__input--duration');
const workoutTab=document.querySelector('.workouts')


/////////////////////////////////

class workout{
    date=new Date();
    id=(Date.now()+'').slice(-10);
    constructor(coords,distance,duration){
        this.coords=coords;
        this.distance=distance;
        this.duration=duration;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description=`${this.type[0].toUpperCase()+this.type.slice(1)} on ${months[this.date.getMonth()]} ${String(this.date.getDate()).padStart(2,'0')}`
    }
}
class running extends workout{
    type='running';
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);
        this.cadence=cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        this.pace=Number(this.duration/this.distance).toFixed(2);
        console.log(this.pace);
    }
}
class cycling extends workout{
    type='cycling';
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain=elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed(){
        this.speed=Number(this.distance/this.duration/60).toFixed(2);
    }
}

////////////////
class app{
    #marker;
    #map;
    #position;
    #workouts=[]
    constructor(){
        this._getPosition();
        this._getLocalStorage();
     form.addEventListener('submit',this._newWorkOut.bind(this));
     activityType.addEventListener('change',this.toggleField);
     document.querySelector('.sidebar').addEventListener('click',this._moveToPopUp.bind(this));
}

  toggleField(){
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _getPosition(){
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
          alert('Could not get location Permission')
      })
  }
  _loadMap(position){
    this.#position=position;
    const {latitude,longitude}=this.#position.coords;
    this.#map = L.map('map').setView([latitude,longitude], 15);

   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);
    
    this.#workouts.forEach(work=>{
        this._renderMarker(work);
    })

    this.#map.on('click',this._showForm.bind(this));
  }

   _showForm(pos){
     this.#marker=pos;
     form.classList.remove('hidden');
     inputDistance.focus();
   }

  // NEW WORKOUT
  _newWorkOut(e){
     e.preventDefault();
     const cadence=Number(inputCadence.value);
     const distance=Number(inputDistance.value);
     const duration=Number(inputDuration.value);
     const elevation=Number(inputElevation.value);
     const type=document.querySelector('.form__input--type').value;
     const {lat,lng}=this.#marker.latlng;
     form.classList.remove('hidden');
     const valueIsFinite=(...value)=>value.every(val=>Number.isFinite(val));
     const valueIsPos=(...value)=>value.every(val=>val>=0);
      let workout;

     if(!valueIsPos(distance,duration)) {
         alert('Only Postive Values Allowed')
         this._hideForm();
         return ;
        }
     if(type==='running'){
         if(valueIsFinite(duration,distance,cadence)&&valueIsPos(cadence)){
            workout=new running([lat,lng],distance,duration,cadence);
         }
     }
     if(type==='cycling'){
        if(valueIsFinite(duration,distance,elevation)){
            workout=new cycling([lat,lng],distance,duration,elevation);
         }
     }
     console.log(workout);
     this.#workouts.push(workout);
     console.log('hi');
     this._hideForm();
     this._renderMarker(workout);
     this._renderWorkout(workout);
     this._setLocalStorage();
  
    }
    _moveToPopUp(e){
        const workEl=e.target.closest('.workout');
        if(!workEl) return ;
        const move=this.#workouts.find(workout=>workout.id===workEl.dataset.id);
        this.#map.setView(move.coords,16,{
            animate:true,
            pan:{
                duration:1,
            }
        })

    }
    _hideForm(){
        inputCadence.value=inputDistance.value=inputDuration.value=inputElevation.value=''
        form.classList.add('hidden');
        // form.style.display='none';
        // form.classList.add('hidden');
        // setTimeout(()=>{
        //     form.style.display='grid'
        // },1100);
   
        //   CHANGES REQUIRED
    }
    // //   this._renderMarker.bind(this)
  _renderMarker(workout){
    L.marker(workout.coords).addTo(this.#map)
    .bindPopup(L.popup({
        maxWidth: 180,
        minWidth: 50,
        autoClose: false,
        closeOnClick: false,
        className: `workout--${workout.type}`,

    }))
    .setPopupContent(`${workout.type==='running'? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)// CHECK LEAFLET DOCUMENTATION
    .openPopup();
}
     _renderWorkout(workout){
         let html=`<li class="workout workout--${workout.type}" data-id="${workout.id}">
         <h2 class="workout__title">${workout.description}</h2>
         <div class="workout__details">
           <span class="workout__icon">${workout.type==='running'? '🏃‍♂️' : '🚴‍♀️'}</span>
           <span class="workout__value">${workout.distance}</span>
           <span class="workout__unit">km</span>
         </div>
         <div class="workout__details">
           <span class="workout__icon">⏱</span>
           <span class="workout__value">${workout.duration}</span>
           <span class="workout__unit">min</span>
         </div>`
         if(workout.type==='running'){
            html=html+` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
         }
         if(workout.type==='cycling'){
             html=html+` <div class="workout__details">
             <span class="workout__icon">⚡️</span>
             <span class="workout__value">${workout.speed}</span>
             <span class="workout__unit">km/h</span>
           </div>
           <div class="workout__details">
             <span class="workout__icon">⛰</span>
             <span class="workout__value">${workout.elevationGain}</span>
             <span class="workout__unit">m</span>
           </div>`
         }

        document.querySelector('.form').insertAdjacentHTML('afterend',html);
     }

     _setLocalStorage(){
         localStorage.setItem('workouts',JSON.stringify(this.#workouts));
     }
     _getLocalStorage(){
        const data=JSON.parse(localStorage.getItem('workouts'));
        if(!data) return ;
        this.#workouts=data;
        this.#workouts.forEach(work=>{
            this._renderWorkout(work);
            // this._renderMarker(work);
        })
     }

   

}
const work=new app();