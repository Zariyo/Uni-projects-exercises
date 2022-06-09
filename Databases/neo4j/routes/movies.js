const express = require('express');
const router = express.Router({ mergeParams: true });
const driver = require('../config/neo4jDriver');

router.get('/', async (req, res) => {
  const session = driver.session();
  var list = [];
  await session
    .run(`MATCH (f:Film) RETURN ID(f) as id, f.title, f.releaseYear, f.genre`)
    .subscribe({
      onKeys: keys => {
        console.log(keys)
      },
      onNext: record => {
        list.push({
          id: record.get('id').low, title: record.get('f.title'),
          releaseYear: record.get('f.releaseYear').low, genre: record.get('f.genre')
        })
      },
      onCompleted: () => {
        res.status(200).send(list);
        session.close();
      },
      onError: error => {
        console.log(error)
      }
    })
});

router.get('/:id', async (req, res) => {
  const session = driver.session();
  await session
    .run(`OPTIONAL MATCH (f:Film) WHERE ID(f) = ${req.params.id} RETURN ID(f) as id, f.title, f.releaseYear, f.genre`)
    .subscribe({
      onKeys: keys => {
        console.log(keys)
      },
      onNext: record => {
        if (record.get('id') == null) {
          res.status(404).send("No such id in database")
        } else {
          res.status(200).send({
            id: record.get('id').low,
            title: record.get('f.title'),
            releaseYear: record.get('f.releaseYear').low,
            genre: record.get('f.genre')
          })
        }

      },
      onCompleted: () => {
        session.close();
      },
      onError: error => {
        console.log(error)
      }
    })
});


router.get('/:id/actors', async (req, res) => {
  const session = driver.session();
  await session
    .run(`OPTIONAL MATCH (a:Actor), (f:Film) WHERE EXISTS { MATCH ((a)-[:ACTED_IN]->(f)) WHERE ID(f)=${req.params.id} } RETURN collect(a.name) AS actors`)
    .subscribe({
      onKeys: keys => {
        console.log(keys)
      },
      onNext: record => {
        if (record.get('actors') == null) {
          res.status(404).send("No such id in database")
        } else {
          res.status(200).send({
            Actors: record.get('actors')
          })
        }

      },
      onCompleted: () => {
        session.close();
      },
      onError: error => {
        console.log(error)
      }
    })
});

router.get('/:id/distinct-actors', async (req, res) => {
  const session = driver.session();
  await session
    .run(`MATCH (a:Actor), (f:Film), ((a)-[r:ACTED_IN]->(f)) WITH a, count(r) as rels WHERE EXISTS { MATCH ((a)-[:ACTED_IN]->(f)) WHERE (ID(f)=${req.params.id}) } AND (rels=1) RETURN collect(a.name) AS actors`)
    .subscribe({
      onKeys: keys => {
        console.log(keys)
      },
      onNext: record => {
        if (record.get('actors') == null) {
          res.status(404).send("No such id in database")
        } else {
          res.status(200).send({
            Actors: record.get('actors')
          })
        }

      },
      onCompleted: () => {
        session.close();
      },
      onError: error => {
        console.log(error)
      }
    })
});

router.get('/:id/actors/:idActor', async (req, res) => {
  const session = driver.session();
  const readTxPromise = session.readTransaction(tx => tx.run(`MATCH (a:Actor), (a2:Actor), (f:Film), ((a)-[r:ACTED_IN]->(f)) WHERE EXISTS { MATCH ((a)-[:IS_FRIEND_WITH]->(a2)) WHERE ID(a2)=${req.params.idActor} AND ID(f)=${req.params.id} AND ID(a)<>${req.params.idActor} } RETURN a.name`));

  readTxPromise.then(result => {
    session.close();

    actorsList = result.records.map(actor => (actor._fields[0]))
    res.send({ actorsList })
  });
});


router.post('/', async (req, res) => {
  const session = driver.session();
  await session
    .run(`MERGE (f:Film {title: '${req.body.title}', releaseYear: ${req.body.releaseYear}, genre: '${req.body.genre}'}) RETURN f.title, f.releaseYear`)
    .subscribe({
      onKeys: keys => {
        console.log(keys)
      },
      onNext: record => {
        res.status(200).send(record.get('f.title') + " " + record.get('f.releaseYear'))
      },
      onCompleted: () => {
        session.close();
      },
      onError: error => {
        console.log(error)
      }
    })
});

router.put('/:id', async (req, res) => {
  const session = driver.session();
  await session
    .run(`MATCH (f:Film) WHERE ID(f) = ${req.params.id} SET f.title = '${req.body.title}', f.releaseYear = ${req.body.releaseYear}, f.genre = '${req.body.genre}' RETURN ID(f) as id, f.title, f.releaseYear, f.genre`)
    .then(result => {
      res.status(200).send("OK")
    })
    .catch(err => res.status(500).send(err))
    .then(() => session.close())
});

router.delete('/:id', async (req, res) => {
  const session = driver.session();
  await session
    .run(`MATCH (f:Film) WHERE ID(f) = ${req.params.id} DETACH DELETE f`)
    .then(result => {
      res.status(200).send("OK")
    })
    .catch(err => console.log(err))
    .then(() => session.close())
});

router.post('/assign-actor', async (req, res) => {
  const session = driver.session();
  await session
    .run(`MATCH (a:Actor), (f: Film) 
        WHERE ID(a) = ${req.body.actorId} AND ID(f) = ${req.body.movieId}
        CREATE (a)-[: ACTED_IN]->(f)`)
    .then(result => {
      res.status(200).send("OK")
    })
    .catch(err => console.log(err))
    .then(() => session.close())
});

module.exports = router;
