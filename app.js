const express = require('express');
const app = express();
const mustacheExpress = require('mustache-express');
const session = require('express-session');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const fs = require('fs');
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(express.static('public'));

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set ('view engine', 'mustache');

app.use(session({
  secret: 'sshhh',
  resave: false,
  saveUninitialized: true
}));

app.get('/', function(req, res){

  req.session.given_word = [];
  req.session.guess_word = [];
  req.session.guessedLetters = [];
  req.session.noOfGuess = 8;

  req.session.mode = "all";

  var randomWord = "";

  //console.log("Selected Level in get:", req.session.mode);

  let new_arr_words = [];

  switch(req.session.mode)
  {
    case "all":
      new_arr_words = words;
      break;
    case "easy":
      for (let i = 0; i < words.length; i++){
        if (words[i].length >3 && words[i].length < 7){
          new_arr_words.push(words[i]);
        }
      }
      break;
    case "normal":
      for (let i = 0; i < words.length; i++){
        if (words[i].length >5 && words[i].length < 9){
          new_arr_words.push(words[i]);
        }
      }
      break;

    case "hard":
      for (let i = 0; i < words.length; i++){
        if (words[i].length >8 && words[i].length < 15){
          new_arr_words.push(words[i]);
        }
      }
      break;
  }

  randomWord = new_arr_words[Math.floor(Math.random() * new_arr_words.length)];
  randomWord = randomWord.toUpperCase();

  let s_word = randomWord.split("");
  req.session.given_word = s_word;

   for (let j = 0; j < req.session.given_word.length; j++) {
     req.session.guess_word.push('-');
   }

   res.render('index', {noOfGuess: req.session.noOfGuess,
                        guessedWord: req.session.guess_word
                      });

});

app.post("/index", function(req, res){

let error_messages = [];
let errors = "";

if(req.body.action == "makeaguess"){

req.checkBody("txt_Guess", "Please enter a valid guess").notEmpty();
req.checkBody("txt_Guess", "Please enter only one alphabet").isLength({max: 1});

errors = req.validationErrors();
if (errors) {
    errors.forEach(function(error) {
    error_messages.push(error.msg);
    });
    res.render("index", {errors: error_messages});
}
else {

    let letter = (req.body.txt_Guess).toUpperCase();
    let good = false;
    let repeat_Msg = "";
    let results = "";
    let out_of_guess = false;

    for (let j = 0; j < req.session.given_word.length; j++) {
        if(req.session.noOfGuess <= 8){
          if(req.session.given_word[j] == letter){
            req.session.guess_word[j] = letter;
            good = true;
          }
        }
    }

    //console.log("req.session Index:", req.session.guessedLetters.indexOf(letter));

    if(!good){ req.session.noOfGuess--; } // Number of guesses

    if(parseInt(req.session.guessedLetters.indexOf(letter)) > -1){  // Redundant alphabet selection
      repeat_Msg = 'Already guessed, please try again';
    }
    else {
      req.session.guessedLetters.push(letter);
    }

    if(parseInt(req.session.noOfGuess) <= 0){
      out_of_guess = true;
      results =  (req.session.given_word.join('|') === req.session.guess_word.join('|'))? 'You win!' : 'Game over!';
    }

    if(req.session.guess_word.indexOf("-")== -1){
      results =  (req.session.given_word.join('|') === req.session.guess_word.join('|'))? 'You win!' : 'Game over!';
    }

  //  console.log("Random Word:", req.session.given_word); ///* For Debugging Purpose */

    res.render("index", {guessedWord: req.session.guess_word,
                        guessedLetters: (req.session.guessedLetters).join(),
                        noOfGuess: req.session.noOfGuess,
                        outOfGuess: out_of_guess,
                        repeatMsg: repeat_Msg,
                        resultsMsg : results
              });
   }
}
else if(req.body.action == "tryagain"){
    req.session.destroy();
    res.redirect("/");
}
/*else if(req.body.action == "mode"){

  let selected =
  {
      sel_1 : "",
      sel_2 : "",
      sel_3: ""
  }

  if(req.body.selLevel == "easy") {selected.sel_1 = "selected";}
  else if(req.body.selLevel == "normal") {selected.sel_2 = "selected";}
  else if(req.body.selLevel == "hard") {selected.sel_3 = "selected";}
  req.session["mode"] = req.body.selLevel;
  console.log("submitted");
  res.render("index", selected);
}*/

});


app.listen(8080, function() {
  console.log("Working hard... Listening on 8080");
});
