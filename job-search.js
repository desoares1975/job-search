require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request-promise');
const auth = require('basic-auth');
const helmet = require('helmet');

app.use(helmet());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  // in this applicatin we're only using a post
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', true);

  // pre-freaking-flight
  if (req.method === 'OPTIONS') {
    return res.status(201).end();
  }

  next();
});

// the code bellow is just a little showoff, I know that ther's a lot more to security then this....
app.use((req, res, next) => {
  let credentials = auth(req);

  if (!credentials || credentials.name !== 'AWWCor' || credentials.pass !== 'secret') {
    return res.status(401).send('UNAUTHORIZED');
  }

  next();
});

app.listen(
  process.env.PORT || 4000,
  () => console.log(`Server up and running on port ${process.env.PORT || 4000}`)
);

app.get('/', (req, res) => res.status(200).send('OK'));
app.post('/search', (req, res) => {
  let { description, location, fullTime } = req.body;
  let onlyFull = (fullTime === true ? '&full_time=true' : '');

  return request.get(
    `${process.env.GITHUB_JOBS_API_URL}?description=${description ?
      description.split(' ').join('+') : ''}&location=${location ?
      location.split(' ').join('+') : ''}${onlyFull}`
  )
    .then(response => {
      let data = (() => {
        try {
          return JSON.parse(response);
        } catch (e) {
          return [];
        }
      })();

      res.status(200).json({total: data.length, data});
    });
});
