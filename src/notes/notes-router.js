const path = require('path')
const express = require('express')
const xss = require('xss')
const NotesService = require('./notes-service')

const NotesRouter = express.Router()
const jsonParser = express.json()

const sanitizeNotes = note => ({
  id: note.id,
  name: xss(note.name),
  content: xxs(note.content),
  modified: note.modified,
  folder_id: note.folder_id
});

NotesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    NotessService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes)
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { name, content, folder_id } = req.body
    const newNote = { name, content, folder_id }

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })


    NotesService.insertNote(
      req.app.get('db'),
      newNote
    )
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(sanitizeNotes(note))
      })
      .catch(next)
  })

NotesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    NotesService.getById(knexInstance, req.params.note_id
    )
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` }
          });
        }
        res.note = note;
        next();
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(sanitizeNotes(res.note));
  })

  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    NotessService.deleteNote( knexInstance, req.params.note_id)
      .then(() => {
        res.status(204).end()
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, content, modified, folder_id } = req.body
    const noteToUpdate = { name, content, modified, folder_id }

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain a 'name', 'content', 'folderid'`
        }
      })

    NotesService.updateNote(
      req.app.get('db'),
      req.params.note_id,
      noteToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  });

module.exports = NotesRouter