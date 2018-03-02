

const model = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");


exports.helpCmd = rl => {
	
	log('Comandos:');
    log('h|help - Muestra esta ayuda.');
    log('list - Listar los quizzes existentes.');
    log('show <id> - Muestra la pregunta y la respuesta del quiz indicado.');
    log('add - Añadir un nuevo quiz interactivamente.');
    log('delete <id> - Borrar el quiz indicado.');
    log('edit <id> - Editar el quiz indicado.');
    log('test <id> - Probar el quiz indicado.');
    log('p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log('credits - Créditos.');
    log('q|quit - Salir del programa.');
    rl.prompt();
};

exports.quitCmd = rl => {
	
	rl.close();
};


exports.addCmd = rl => {
	
	rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {
		
		rl.question(colorize('Introduzca una respuesta: ', 'red'), answer => {
			
			model.add(question, answer);
			log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
			rl.prompt();
		});
	});
};


exports.listCmd = rl => {
	
	model.getAll().forEach((quiz, id) => {
		
		log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	
	rl.prompt();
};


exports.showCmd = (rl, id) => {
	
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try{
			const quiz = model.getByIndex(id);
			log(`[${colorize(id,'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};


exports.testCmd = (rl, id) => {
	
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	}else{
		try{
			const quiz=model.getByIndex(id);
			rl.question(`${quiz.question} ${colorize(" => ", "magenta")}`, answer => {	
				
				if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
					log("Su respuesta es:");
					biglog("CORRECTA","green");
					rl.prompt();
					}
				else{
					log("Su respuesta es:");
					biglog("INCORRECTA","red");
					rl.prompt();
					}
					
				});
			
		} catch(error) {
			errorlog(error.message);
			rl.prompt();
		}
	}
	
};


exports.playCmd = rl => {
	
	let score = 0;
	let toBeResolve = [];
	for (i=0;i<model.count();i++){
		toBeResolve.push(i);
	}
	const playOne = () => {

		if (toBeResolve.length === 0){
			log("No quedan más preguntas");
            log(`Has obtenido una puntuación total de: ${colorize(score,'green')}`);
            rl.prompt();
		} else {

			let aux = Math.floor((Math.random()*toBeResolve.length));
			let id = toBeResolve[aux];
			toBeResolve.splice(aux,1);
            try{
                const quiz=model.getByIndex(id);
                rl.question(`${quiz.question} ${colorize(" => ", "magenta")}`, answer => {

                    if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
                        log("Su respuesta es:");
                        biglog("CORRECTA","green");
                        log(`Ha conseguido ${colorize(score+1,'green')} punto(s) hasta el momento`);
                        score++;
                        playOne();
                    }
                    else{
                        log("Su respuesta es:");
                        biglog("INCORRECTA","red");
                        log(`Ha conseguido un total de ${colorize(score,'green')} puntos`);
                        rl.prompt();
                    }

                });

            } catch(error) {
                errorlog(error.message);
                rl.prompt();
            }
		}
	}
	playOne();
};


exports.deleteCmd = (rl, id) => {
	
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try{
			model.deleteByIndex(id);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};


exports.editCmd = (rl, id) => {
	
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try{
			
			const quiz= model.getByIndex(id);
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
			rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {	
				
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
				rl.question(colorize('Introduzca una respuesta: ', 'red'), answer => {
					model.update(id, question, answer);
					log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
					rl.prompt();
				});
			});
		} catch(error) {
			errorlog(error.message);
			rl.prompt();
		}
	}
};


exports.creditsCmd = rl => {
	
	log('Autor de la practica:');
	log('Jaime de Frutos Cerezo','green');
	rl.prompt();
};