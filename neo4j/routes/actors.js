const express = require('express');
const router = express.Router({mergeParams: true});
const driver = require('../config/neo4jDriver');
const _ = require('lodash')

router.get('/', async (req, res) => {
  const session = driver.session();
  var list = []
  await session
    .run('MATCH (a:Actor) RETURN { id: ID(a), name: a.name, age: a.age, company: a.company}')
    .then(result =>{
      result.records.map(key => list=[...list, ...key._fields])
      list.map(actor => actor.id = actor.id.low)
      console.log(list)
      res.status(200).send(list)
    })
    .catch(error => {console.log(error)})
    .then(() => session.close())
});

router.get('/popular', async (req, res) => {
  const session = driver.session();
    const readTxPromise = session.readTransaction(tx => tx.run(`MATCH (a:Actor), (f:Film), ((a)-[r:ACTED_IN]->(f)) WITH a, count(r) as rels WHERE EXISTS { MATCH ((a)-[:ACTED_IN]->(f)) } RETURN { name: a.name, rels: rels }`));

    readTxPromise.then(result => {
      session.close();

      actorsList = result.records.map(actor=>(actor._fields[0]))
      actorsList.map(actor => actor.rels = actor.rels.low)
      actorsList = _.sortBy(actorsList, ['rels']).reverse().slice(0,3)
      res.send({actorsList})
    });
});


router.get('/:id', async (req, res) => {
  const session = driver.session();
  await session
    .run(`MATCH (a:Actor) WHERE ID(a) = ${req.params.id} RETURN a.name, a.age, a.company`)
    .subscribe({
      onKeys: keys => {
        console.log(keys)
      },
      onNext: record => {
        res.send({
          name: record.get('a.name'),
          age: record.get('a.age'),
          comapany: record.get('a.company')
        })},
      onCompleted: () => {
        session.close();
      },
      onError: error => {
        console.log(error)
      }
    })
});




router.post('/', async (req, res) => {
    const session = driver.session();
    await session
        .run(`MERGE (a:Actor {name : '${req.body.name}', age: '${req.body.age}', company: '${req.body.company}' }) RETURN a.name, a.age, a.company`)
        .subscribe({
          onKeys: keys => {
            console.log(keys)
          },
          onNext: record => {
            res.send(record.get('a.name') + " " + record.get('a.company'))
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
    .run(`MATCH (a:Actor) WHERE ID(a) = ${req.params.id} SET a.name = '${req.body.name}', a.age = '${req.body.age}', a.company = '${req.body.company}'  `)
    .then(result =>{
      res.status(200).send("OK")
    })
    .catch(error => {console.log(error)})
    .then(() => session.close())
});

router.delete('/:id', async (req, res) => {
  const session = driver.session();
  await session
    .run(`MATCH (a:Actor) WHERE ID(a) = ${req.params.id} DETACH DELETE a`)
    .then(result =>{
      res.status(200).send("OK")
    })
    .catch(error => {console.log(error)})
    .then(() => session.close())
});

module.exports = router;


