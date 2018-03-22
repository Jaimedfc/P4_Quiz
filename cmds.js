
const Sequelize = require('sequelize');
const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");


exports.helpCmd = (socket, rl) => {
	
	log(socket, 'Comandos:');
    log(socket, 'h|help - Muestra esta ayuda.');
    log(socket, 'list - Listar los quizzes existentes.');
    log(socket, 'show <id> - Muestra la pregunta y la respuesta del quiz indicado.');
    log(socket, 'add - Añadir un nuevo quiz interactivamente.');
    log(socket, 'delete <id> - Borrar el quiz indicado.');
    log(socket, 'edit <id> - Editar el quiz indicado.');
    log(socket, 'test <id> - Probar el quiz indicado.');
    log(socket, 'p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log(socket, 'credits - Créditos.');
    log(socket, 'q|quit - Salir del programa.');
    rl.prompt();
};

const makeQuestion = ( rl, text) => {

	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

exports.quitCmd = (socket, rl) => {
	return new Sequelize.Promise((resolve, reject) => {
        rl.close();
        socket.end();
        resolve();
        return;
	});

};


exports.addCmd = (socket, rl) => {
	
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
			log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `)
		})
		.catch(Sequelize.ValidationError, error => {
			errorlog(socket, 'El quiz es erroneo: ');
			error.errors.forEach(({message}) => errorlog(message));
		})
		.catch(error => {
			errorlog(socket, error.message);
		})
		.then(() => {
			rl.prompt();
		});
};


exports.listCmd = (socket, rl) => {
	
	models.quiz.findAll()
		.each(quiz => {
			log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
		})
		.catch(error => {
			errorlog(socket, error.message);
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


exports.showCmd = (socket, rl, id) => {
	
	validateId(id)
		.then(id => models.quiz.findById(id))
		.then(quiz => {
			if (!quiz) {
				throw new Error(`No existe un quiz asociado al id=${id}.`);
			}
			log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>',`magenta`)} ${quiz.answer}`);
		})
		.catch(error => {
			errorlog(socket, error.message);
		})
		.then(() => {
			rl.prompt();
		});
};


exports.testCmd = (socket, rl, id) => {

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
						log(socket, "Su respuesta es correcta.");
						biglog(socket, "CORRECTA","green");
						resolve();
						return;
					});
				} else {
					return new Sequelize.Promise((resolve,reject) => {
						log(socket, "Su respuesta es incorrecta.");
						biglog(socket, "INCORRECTA","red");
                        resolve();
						return;
					});
				}
			});

    })
	.catch(Sequelize.ValidationError, error => {
	errorlog(socket, 'El quiz es erroneo: ');
	error.errors.forEach(({message}) => errorlog(socket, message));
    })
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then (() => {
		rl.prompt();
	});
};



exports.playCmd = (socket, rl) => {

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
        errorlog(socket, 'El quiz es erroneo: ');
        error.errors.forEach(({message}) => errorlog(socket, message));
    	})
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });


    const PlayOne = () => {

        return new Sequelize.Promise((resolve, reject) => {

            if (toBePlayed.length <= 0) {
                log(socket, ' No quedan más preguntas.');
                log(socket, ` Ha obtenido un total de ${colorize(score, 'magenta')} punyos.`);
                resolve();
                return;
            } else {


                let pos = Math.floor(Math.random() * toBePlayed.length);

                let quiz = toBePlayed[pos];
                toBePlayed.splice(pos, 1);
                makeQuestion(rl, `${quiz.question} ${colorize('=> ', 'magenta')}`)
                    .then(answer => {
                        if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {

                            log(socket, " Su respuesta es correcta.");
                            biglog(socket, " CORRECTA", "green");
                            log(socket, ` Ha conseguido un total de ${colorize(score + 1, 'magenta')} punto(s) hasta el momento.`);
                            score++;
                            resolve(PlayOne());
                            return;

                        } else {

                                log(socket, " Su respuesta es incorrecta.");
                                biglog(socket, " INCORRECTA", "red");
                                log(socket, " Fin del juego");
                                biglog(socket, " GAME OVER", "red");
                                log(socket, ` Ha conseguido un total de ${colorize(score, 'magenta')} puntos`);
                                resolve();
                                return;

                        }

                    });


            }
        });
    }
};

exports.deleteCmd = (socket, rl, id) => {
	
	validateId(id)
		.then(id => models.quiz.destroy({where: {id}}))
		.catch(error => {
			errorlog(socket, error.message);
		})
		.then(() => {
			rl.prompt();
		});
};


exports.editCmd = (socket, rl, id) => {
	
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
        log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>',`magenta`)} ${quiz.answer}`);

    })
	.catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo: ');
        error.errors.forEach(({message}) => errorlog(socket, message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.creditsCmd = (socket, rl) => {
	return new Sequelize.Promise((resolve, reject) => {
        log(socket, 'Autor de la practica:');
        log(socket, 'Jaime de Frutos Cerezo','green');
        resolve();
        return;
	})
	.then(() => {
        rl.prompt();
	});

};