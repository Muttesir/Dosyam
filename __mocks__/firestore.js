const addDoc    = jest.fn(() => Promise.resolve({ id: 'new-doc-id' }));
const updateDoc = jest.fn(() => Promise.resolve());
const deleteDoc = jest.fn(() => Promise.resolve());
const getDocs   = jest.fn(() => Promise.resolve({ docs: [] }));
const collection = jest.fn((...args) => args.join('/'));
const doc        = jest.fn((...args) => args.join('/'));
const orderBy    = jest.fn((f, d) => ({ field: f, dir: d }));
const query      = jest.fn((...args) => args[0]);

module.exports = { addDoc, updateDoc, deleteDoc, getDocs, collection, doc, orderBy, query };
