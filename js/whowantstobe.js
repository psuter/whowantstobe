// Pimp my lib.
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

function Game(questionFile) {
    this.questionFile = questionFile;

    this.questions = [];
    this.used      = [];

    this.isReady = false;
    this.readyClosures = [];

    this.isGameOver = true;
    this.difficulty = 0;
    this.uncoveredCount    = 0;
    this.currentQuestion   = undefined;
    this.fiftyFiftied      = false;

    this.gameOver();
    this.parseQuestions();
};

Game.prototype.ready = function (closure) {
    if(this.isReady) {
        closure();
    } else {
        this.readyClosures.push(closure);
    }
};

Game.prototype.flushReady = function () {
    var i;

    this.isReady = true;

    for(i = 0; i < this.readyClosures.length; i = i + 1) {
        this.readyClosures[i]();
    }

    this.readyClosures = [];
};

Game.prototype.parseQuestions = function () {
    var self, i, lines, line, parts, q;
    
    self = this;

    $.get(this.questionFile, function (content) {
        lines = content.split("\n");

        for(i in lines) {
            line = $.trim(lines[i]);
            parts = line.split("::");

            if(parts.length === 7) {
                q = new Question(
                    $.trim(parts[1]),
                    1 * $.trim(parts[0]),
                    (1 * $.trim(parts[2])) - 1,
                    $.trim(parts[3]),
                    $.trim(parts[4]),
                    $.trim(parts[5]),
                    $.trim(parts[6])
                );

                self.questions.push(q);
                self.used.push(false);
            }
        }

        self.flushReady();
    }, "text");
};

Game.prototype.newGame = function () {
    if(confirm("Are you sure you want to start a new game?")) {
        this.difficulty = 0;
        this.isGameOver = false;
        
        this.nextQuestion(false);
    }
};

Game.prototype.gameOver = function () {
    this.isGameOver = true;
    $("#questiontext").text("Game over !");
    for(i = 1; i <= 4; i += 1) {
        $("#optioncontent" + i).css("visibility", "hidden");
        $("#option" + i).css("background-image", "url('images/whowantstobe-losange-black.png')");
    }
};

Game.prototype.nextQuestion = function (increaseDifficulty) {
    if(increaseDifficulty) {
        this.difficulty += 1;
    }

    if(this.difficulty > 5) {
        this.gameOver();
    } else {
        this.loadQuestion();
    }
};

Game.prototype.loadQuestion = function (qid = -1) {
    if(!this.isReady || this.isGameOver) return;

    var i;
    
    if (qid === -1) {
        do {
            i = 1 * Math.floor(Math.random() * this.questions.length);
        } while(this.used[i] || this.questions[i].difficulty !== this.difficulty);
    } else {
        i = qid;
    }

    this.used[i] = true;

    this.currentQuestion = this.questions[i];
    this.fiftyFiftied = false;

    if(this.currentQuestion.question.endsWith(".jpg") ||
       this.currentQuestion.question.endsWith(".jpg") ||
       this.currentQuestion.question.endsWith(".jpeg")) {

        $("#questiontext").html();
        var img = new Image();
        img.src = this.currentQuestion.question;

        $(img).load(function () {
            $("#questionpicture").css("background-image", "url('" + img.src + "')");
            $("#questionpicture").css("background-position", "center");

            var r = img.width / img.height;
            if(r > (720 / 320)) {
                $("#questionpicture").css("background-size", "auto 100%");
            } else {
                $("#questionpicture").css("background-size", "100% auto");
            }

            $("#questionpicture").css("visibility", "visible");
        });

    } else {
        $("#questiontext").html(this.currentQuestion.question);
        $("#questionpicture").css("visibility", "hidden");
    }

    for(i = 1; i <= 4; i += 1) {
        if(this.currentQuestion.answers[i-1].length > 50) {
            $("#option" + i + "text").attr("class", "smalltextoption");
        } else {
            $("#option" + i + "text").attr("class", "textoption");
        }
        $("#option" + i + "text").html(this.currentQuestion.answers[i-1]);
        $("#optioncontent" + i).css("visibility", "hidden");
        $("#option" + i).css("background-image", "url('images/whowantstobe-losange-black.png')");
    }

    this.uncoveredCount = 0;
};

Game.prototype.uncoverNext = function () {
    if(!this.isReady || this.isGameOver) return;

    if(this.uncoveredCount >= 0 && this.uncoveredCount < 4) {
        $("#optioncontent" + (this.uncoveredCount + 1)).css("visibility", "visible");
        this.uncoveredCount += 1;
    }
};

Game.prototype.uncoverAll = function () {
    var i;
    if(!this.isReady || this.currentQuestion === undefined || this.isGameOver) return;

    if(this.fiftyFiftied) return;

    for(i = this.uncoveredCount; i < 4; i += 1) {
        this.uncoverNext();
    }
}

Game.prototype.select = function (answerID) { // answerID is 1-indexed
    var i;
    if(!this.isReady || this.currentQuestion === undefined || this.isGameOver) return;
    this.uncoverAll();

    for(i = 1; i <= 4; i += 1) {
        if(i === answerID) {
            $("#option" + i).css("background-image", "url('images/whowantstobe-losange-orange.png')");
        } else {
            $("#option" + i).css("background-image", "url('images/whowantstobe-losange-black.png')");
        }
    }
};

Game.prototype.reveal = function () {
    var c;
    if(!this.isReady || this.currentQuestion === undefined || this.isGameOver) return;
    this.uncoverAll();
    c = this.currentQuestion.solution + 1;
    $("#option" + c).css("background-image", "url('images/whowantstobe-losange-green.png')");
};

Game.prototype.fiftyFifty = function () {
    var c, fst, snd;

    if(!this.isReady || this.currentQuestion === undefined || this.fiftyFiftied) return;

    c = this.currentQuestion.solution;

    fst = c;
    while(fst === c) {
        fst = Math.floor(Math.random() * 4.0);
    }

    snd = c;
    while(snd === c || snd === fst) {
        snd = Math.floor(Math.random() * 4.0);
    }

    this.uncoverAll();
    
    $("#optioncontent" + (fst + 1)).css("visibility", "hidden");
    $("#optioncontent" + (snd + 1)).css("visibility", "hidden");

    this.fiftyFiftied = true;
};

function Question(question, difficulty, solution, answer0, answer1, answer2, answer3) {
    this.question   = question;
    this.difficulty = difficulty;
    this.solution   = solution;
    this.answers    = [ answer0, answer1, answer2, answer3 ];
};
