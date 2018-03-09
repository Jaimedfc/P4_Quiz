
const Sequelize = require('sequelize');
const {models} = require('./model');
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

const makeQuestion = (rl, text) => {

	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.quitCmd = rl => {
	return new Sequelize.Promise((resolve, reject) => {
        rl.close();
        resolve();
        return;
	});

};


exports.addCmd = rl => {
	
	makeQuestion(rl, ' Introduzca una pregunta: ')
		.then(q => {
			return makeQuestion(rl, ' Introduzca una respuesta ')
				.then(a => {
					return {question:q, answer:a};
				});
		})
		.then(quiz => {
			return models.quiz.create(quiz);
		})
		.then((quiz) => {
			log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `)
		})
		.catch(Sequelize.ValidationError, error => {
			errorlog('El quiz es erroneo: ');
			error.errors.forEach(({message}) => errorlog(message));
		})
		.catch(error => {
			errorlog(error.message);
		})
		.then(() => {
			rl.prompt();
		});
};


exports.listCmd = rl => {
	
	models.quiz.findAll()
		.each(quiz => {
			log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
		})
		.catch(error => {
			errorlog(error.message);
		})
		.then(() => {
			rl.prompt();
		});

};

const validateId = id => {

	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>.`));
        } else {
			id = parseInt(id);
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};


exports.showCmd = (rl, id) => {
	
	validateId(id)
		.then(id => models.quiz.findById(id))
		.then(quiz => {
			if (!quiz) {
				throw new Error(`No existe un quiz asociado al id=${id}.`);
			}
			log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>',`magenta`)} ${quiz.answer}`);
		})
		.catch(error => {
			errorlog(error.message);
		})
		.then(() => {
			rl.prompt();
		});
};


exports.testCmd = (rl, id) => {

	validateId(id)
	.then(id => models.quiz.findById(id))
    .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            return makeQuestion(rl, `${quiz.question} ${colorize('=> ','magenta')}`).
			then(a => {
				if (a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
					return new Sequelize.Promise((resolve,reject) => {
						log("Su respuesta es correcta.");
						biglog("CORRECTA","green");
						resolve();
						return;
					});
				} else {
					return new Sequelize.Promise((resolve,reject) => {
						log("Su respuesta es incorrecta.");
						biglog("INCORRECTA","red");
                        resolve();
						return;
					});
				}
			});

    })
	.catch(Sequelize.ValidationError, error => {
	errorlog('El quiz es erroneo: ');
	error.errors.forEach(({message}) => errorlog(message));
    })
	.catch(error => {
		errorlog(error.message);
	})
	.then (() => {
		rl.prompt();
	});
};



exports.playCmd = rl => {

    let score = 0;
    let toBePlayed = [];
    models.quiz.findAll({raw: true})
        .then(quizzes => {
            return new Sequelize.Promise((resolve, reject) => {
                toBePlayed = quizzes;
                resolve();
                return;
			});

        })
        .then(() => {
            return PlayOne();

        })
		.catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo: ');
        error.errors.forEach(({message}) => errorlog(message));
    	})
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });


    const PlayOne = () => {

        return new Sequelize.Promise((resolve, reject) => {

            if (toBePlayed.length <= 0) {
                log(' No quedan más preguntas.');
                log(` Ha obtenido un total de ${colorize(score, 'magenta')} punyos.`);
                resolve();
                return;
            } else {


                let pos = Math.floor(Math.random() * toBePlayed.length);

                let quiz = toBePlayed[pos];
                toBePlayed.splice(pos, 1);
                makeQuestion(rl, `${quiz.question} ${colorize('=> ', 'magenta')}`)
                    .then(answer => {
                        if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {

                            log(" Su respuesta es correcta.");
                            biglog(" CORRECTA", "green");
                            log(` Ha conseguido un total de ${colorize(score + 1, 'magenta')} puntos hasta el momento.`);
                            score++;
                            resolve(PlayOne());
                            return;

                        } else {

                                log(" Su respuesta es incorrecta.");
                                biglog(" INCORRECTA", "red");
                                log(" Fin del juego");
                                biglog(" GAME OVER", "red");
                                log(` Ha conseguido un total de ${colorize(score, 'magenta')} puntos`);
                                resolve();
                                return;

                        }

                    });


            }
        });
    }
};

exports.deleteCmd = (rl, id) => {
	
	validateId(id)
		.then(id => models.quiz.destroy({where: {id}}))
		.catch(error => {
			errorlog(error.message);
		})
		.then(() => {
			rl.prompt();
		});
};


exports.editCmd = (rl, id) => {
	
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id = ${id}.`);
		}

		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, ' Introduzca la pregunta: ')
		.then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
            return makeQuestion(rl, ' Introduzca la respuesta: ')
				.then(a => {
					quiz.question = q;
                    quiz.answer = a;
                    return quiz;
				});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
        log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>',`magenta`)} ${quiz.answer}`);

    })
	.catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo: ');
        error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.creditsCmd = rl => {
	return new Sequelize.Promise((resolve, reject) => {
        log('Autor de la practica:');
        log('Jaime de Frutos Cerezo','green');
        resolve();
        return;
	})
	.then(() => {
        rl.prompt();
	});

};