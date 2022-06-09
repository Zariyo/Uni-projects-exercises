const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    return res.send({allUsers: [...users]});
  } catch(err) {
    return res.status(500).send({error: err.message})
  }
});


router.post('/', async (req, res) => {
  const user = new User({
    login: req.body.login,
    email: req.body.email,
    registrationDate: req.body.registrationDate
  })

  try {
    const newUser = await user.save();
    return res.status(201).send(newUser);
  } catch(err) {
    return res.status(400).send({error: err.message});
  }
});

router.get('/:id', async (req, res) => {
try {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).send({message: 'user with this id does not exist'});
  }
  return res.send(user);
} catch (err) {
  return res.status(500).send({error: err.message});
}
});


router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const user = new User({
    login: req.body.login,
    email: req.body.email,
    registrationDate: req.body.registrationDate
  })

  try {
    const userToUpdate = await User.findById(id);
    if (userToUpdate) {
      const updated = await User.updateOne(userToUpdate, {...req.body})
      return res.send("user has been updated")
    }
    const newUser = await user.save();
    return res.send(newUser)
  } catch(err) {
    return res.status(500).send({error: err.message});
  }
});


router.delete('/:id', async (req, res) => {
const id = req.params.id;
try {
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).send({message: 'unable to delete, user with this id does not exist'});
  }
  await user.remove();
  return res.send({message: `User with id: ${id} has been deleted`});
} catch(err) {
  res.status(500).send({error: err.message});
}
});


router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send({message: 'user with this id does not exist'});
    }
    const result = await User.updateOne(user, {$set: req.body});
    return res.send({message: `user with id: ${id} has been updated`});
  } catch(err) {
    return res.status(400).send({error: err.message});
  }
});

module.exports = router;