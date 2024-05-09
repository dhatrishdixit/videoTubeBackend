// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('youtubeClone');

// Create a new document in the collection.
db.getCollection('users').updateMany({
    {},
    { $set: { new_field_name: "" } }
});
