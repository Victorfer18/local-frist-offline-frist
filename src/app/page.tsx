"use client";

import { useEffect, useState } from "react";
import PouchDB from "pouchdb";

export default function Home() {
  const [localDB, setLocalDB] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const local = new PouchDB("localdb");
      const remoteDB = new PouchDB('http://admin:password@localhost:5984/remotedb');
  
      local.sync(remoteDB, {
        live: true,
        retry: true,
      });
  
      local
        .changes({
          since: "now",
          live: true,
          include_docs: true,
        })
        .on("change", () => {
          fetchDocs(local);
        });
      setLocalDB(local);
      fetchDocs(local);
    })();
  }, []);

  const fetchDocs = async (db: any) => {
    const result = await db.allDocs({ include_docs: true });
    const list = result.rows.map((row: { doc: any; }) => row.doc);
    // Ordena por data de criação, se quiser
    setDocs(list.sort((a: { createdAt: number; }, b: { createdAt: number; }) => (a.createdAt < b.createdAt ? 1 : -1)));
  };
  
  const handleDelete = async (id: string, rev: string) => {
    if (!localDB) return;
    await localDB.remove(id, rev);
    fetchDocs(localDB);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!name.trim()) return;
    await localDB.post({
      name,
      createdAt: new Date().toISOString(),
    });
    setName("");
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Sincronização com CouchDB</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          className="flex-1 border px-2 py-1 rounded"
          placeholder="Digite um nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Adicionar
        </button>
      </form>

      <ul className="space-y-2">
        {docs.map((doc) => (
          <li key={doc._id} className="border rounded p-2 flex items-center justify-between">
        <div>
          <input
            type="text"
            value={doc.name}
            onChange={async (e) => {
          const updatedName = e.target.value;
          await localDB.put({
            ...doc,
            name: updatedName,
          });
          fetchDocs(localDB);
            }}
            className="border px-2 py-1 rounded w-full"
          />
          <small className="text-gray-500">{doc.createdAt}</small>
        </div>
        <button
          onClick={() => handleDelete(doc._id, doc._rev)}
          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 ml-2"
        >
          Deletar
        </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
