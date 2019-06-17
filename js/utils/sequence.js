module.exports = fns => fns.reduce( ( p, fn ) => {
    return p.then( fn );
}, Promise.resolve() );