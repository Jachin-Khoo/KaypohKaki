const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

const DEFAULT_TODOS = [
  { todoId: 'paynow', title: 'Link NRIC to PayNow', note: 'Needed to receive the Cost-of-Living Special Payment automatically.', tag: 'DUE 15 NOV', tagClass: 'tag-action', done: false },
  { todoId: 'cpf-topup', title: 'Submit CPF voluntary top-up', note: "Complete before year end to claim this year's tax relief.", tag: 'DUE 31 DEC', tagClass: 'tag-housing', done: false },
  { todoId: 'hdb-update', title: 'Update HDB flat particulars', note: 'Confirmed eligible for the new income ceiling.', tag: '', tagClass: '', done: true },
  { todoId: 'medisave', title: 'Check MediSave top-up eligibility', note: 'Not eligible this cycle — income above threshold.', tag: '', tagClass: '', done: true },
];

router.get('/:clientId', async (req, res) => {
  const { clientId } = req.params;
  let todos = await Todo.find({ clientId }).sort({ createdAt: 1 });
  if (todos.length === 0) {
    todos = await Todo.insertMany(DEFAULT_TODOS.map((t) => ({ ...t, clientId })));
  }
  res.json(todos);
});

router.patch('/:clientId/:todoId', async (req, res) => {
  const { clientId, todoId } = req.params;
  const todo = await Todo.findOneAndUpdate(
    { clientId, todoId },
    { $set: { done: !!req.body.done } },
    { new: true }
  );
  res.json(todo);
});

module.exports = router;
