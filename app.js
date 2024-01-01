const express = require('express');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

function getTimestamp() {
  const now = new Date();
  return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}

function calculateBMI(height, weight, age, gender, heightUnit, weightUnit) {
    
    let heightInMeters, weightInKg;

    if (heightUnit === 'cm') {
      heightInMeters = height / 100;
    } else if (heightUnit === 'in') {
      heightInMeters = height * 0.0254;
    } else {
      throw new Error('Unsupported height unit');
    }
  
    if (weightUnit === 'kg') {
      weightInKg = weight;
    } else if (weightUnit === 'lb') {
      weightInKg = weight * 0.45;
    } else {
      throw new Error('Unsupported weight unit');
    }
    const bmiResult = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
  
    let interpretation = '';
    if (bmiResult < 18.5) {
      interpretation = 'Underweight';
    } else if (bmiResult >= 18.5 && bmiResult < 24.9) {
      interpretation = 'Normal Weight';
    } else if (bmiResult >= 25 && bmiResult < 29.9) {
      interpretation = 'Overweight';
    } else {
      interpretation = 'Obese';
    }
  
    return { bmi: bmiResult, interpretation };
  }
  
let bmiHistory = [];
if (fs.existsSync('bmiHistory.json')) {
  const data = fs.readFileSync('bmiHistory.json');
  bmiHistory = JSON.parse(data);
}

function saveBMIHistory() {
  fs.writeFileSync('bmiHistory.json', JSON.stringify(bmiHistory, null, 2));
}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${getTimestamp()}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/HTMLki/index.html');
});

app.route('/bmicalculator')
  .get((req, res) => {
    res.sendFile(__dirname + '/HTMLki/bmicalculator.html');
  })
  .post([
    body('height').notEmpty().isNumeric(),
    body('weight').notEmpty().isNumeric(),
    body('age').notEmpty().isNumeric(),
    body('gender').notEmpty().isIn(['male', 'female']),
    body('heightUnit').notEmpty().isIn(['cm', 'in']),
    body('weightUnit').notEmpty().isIn(['kg', 'lb']),
  ], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).send('Invalid input');
    }

    const { height, weight, age, gender, heightUnit, weightUnit } = req.body;
    const { bmi, interpretation } = calculateBMI(height, weight, age, gender, heightUnit, weightUnit);

    bmiHistory.push({ height, weight, age, gender, bmi, interpretation, timestamp: getTimestamp() });
    saveBMIHistory();

    res.send(`Your BMI is ${bmi}. This is considered ${interpretation}.`);
  });

app.get('/history', (req, res) => {
  res.json(bmiHistory);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
