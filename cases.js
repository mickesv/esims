// Each entry is one case.
// TODO Of course, this should be in a proper database instead


export var cases=[
    {name: 'Molgan Åberg',
     bio: {age: 12, 
           gender: 'pojke',
           weight: 40,
           height: 150,
          },
     history: [
         'Ingen tar mig på allvar.', 
         'Det är bara Alfons som ser mig.',
         '... och han använder mig bara för att ge mig skulden när <i>han</i> har gjort något dumt!',
         'Ibland tvivlar jag på om jag ens finns'],
     tests: [
         {key: 'gul kork', value: 'normal'},
         {key: 'röd kork', value: 'hög'},
         {key: 'lila kork', value: 'låg'},
     ],
     extraActions: [],
     resolutions: [
         {key: 'diagnos', value: 'Påhittad', feedback: ''},
         {key: 'inläggning', value: '', feedback: 'Troligen rätt, men är det Molgan eller Alfons som skall läggas in?'},
         {key: 'skicka hem', value: '', feedback: 'Skall de återkomma om besvären kvarstår?'},
         {key: 'remiss', value: '', feedback: 'Varför då?'},
     ],
    },
];

export default cases;
