import { useEffect, useState } from 'react';
import PouchDB from 'pouchdb';

export default function Home() {
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const localDB = new PouchDB('localdb');
    const remoteDB = new PouchDB('http://admin:password@couchdb:5984/remotedb');

    localDB.sync(remoteDB, { live: true, retry: true });

    localDB.post({ name: 'Novo registro', createdAt: new Date().toISOString() });

    const fetchDocs = async () => {
      const result = await localDB.allDocs({ include_docs: true });
      setDocs(result.rows.map((row) => row.doc));
    };

    fetchDocs();
  }, []);

  return (
    <div>
      <h1>Sincronização com CouchDB</h1>
      <pre>{JSON.stringify(docs, null, 2)}</pre>
    </div>
  );
}
