import { StudyMaterial, Concept, ProofSession } from '../types';

const DB_NAME = 'proof_local_vault';
const DB_VERSION = 1;

class ProofStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('materials')) {
          const materialStore = db.createObjectStore('materials', { keyPath: 'id' });
          materialStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('concepts')) {
          const conceptStore = db.createObjectStore('concepts', { keyPath: 'id' });
          conceptStore.createIndex('materialId', 'materialId', { unique: false });
          conceptStore.createIndex('state', 'state', { unique: false });
        }

        if (!db.objectStoreNames.contains('proofSessions')) {
          const sessionStore = db.createObjectStore('proofSessions', { keyPath: 'id' });
          sessionStore.createIndex('conceptId', 'conceptId', { unique: false });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Materials ---
  async getAllMaterials(): Promise<StudyMaterial[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('materials', 'readonly');
      const store = tx.objectStore('materials');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getMaterial(id: string): Promise<StudyMaterial | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('materials', 'readonly');
      const store = tx.objectStore('materials');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveMaterial(material: StudyMaterial): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('materials', 'readwrite');
      const store = tx.objectStore('materials');
      const request = store.put(material);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMaterial(id: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['materials', 'concepts'], 'readwrite');
    tx.objectStore('materials').delete(id);
    
    // Also delete associated concepts
    const conceptStore = tx.objectStore('concepts');
    const index = conceptStore.index('materialId');
    const request = index.getAllKeys(id);
    request.onsuccess = () => {
      for (const key of request.result) {
        conceptStore.delete(key);
      }
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Concepts ---
  async getAllConcepts(): Promise<Concept[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('concepts', 'readonly');
      const store = tx.objectStore('concepts');
      const request = store.getAll();
      request.onsuccess = () => {
        const concepts = (request.result || []) as Concept[];
        // Check for stale concepts (verified > 5 days ago)
        const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const updated = concepts.map(c => {
          if (c.state === 'VERIFIED' && c.lastVerifiedAt && (now - c.lastVerifiedAt > fiveDaysMs)) {
            return { ...c, state: 'STALE' as const };
          }
          return c;
        });
        resolve(updated);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getConceptsByMaterial(materialId: string): Promise<Concept[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('concepts', 'readonly');
      const index = tx.objectStore('concepts').index('materialId');
      const request = index.getAll(materialId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getConcept(id: string): Promise<Concept | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('concepts', 'readonly');
      const store = tx.objectStore('concepts');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveConcept(concept: Concept): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('concepts', 'readwrite');
      const store = tx.objectStore('concepts');
      const request = store.put(concept);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveConcepts(concepts: Concept[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('concepts', 'readwrite');
      const store = tx.objectStore('concepts');
      concepts.forEach(c => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Proof Sessions ---
  async getAllSessions(): Promise<ProofSession[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('proofSessions', 'readonly');
      const store = tx.objectStore('proofSessions');
      const request = store.getAll();
      request.onsuccess = () => {
        const sessions = (request.result || []) as ProofSession[];
        sessions.sort((a, b) => b.timestamp - a.timestamp);
        resolve(sessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSession(session: ProofSession): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('proofSessions', 'readwrite');
      const store = tx.objectStore('proofSessions');
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async seedInitialDataIfEmpty(): Promise<void> {
    const materials = await this.getAllMaterials();
    if (materials.length > 0) return;

    const sampleMaterial: StudyMaterial = {
      id: 'mat-os-paging',
      title: 'Operating Systems: Virtual Memory & Paging',
      source: 'Lecture Notes / Abraham Silberschatz OS Concepts',
      content: `Virtual memory provides an illusion of a very large, uniform memory space to each process. 
The address space generated by the CPU is divided into fixed-size chunks called "pages". Physical memory (RAM) is similarly divided into fixed-size frames of the exact same size.

The Memory Management Unit (MMU) uses a Page Table to translate virtual addresses (Page Number + Offset) to physical frame addresses. 

A Page Fault occurs when a program attempts to access a page that is mapped in the virtual address space but is NOT currently loaded in physical RAM. 
Crucially: A page fault is NOT an indication that memory is full. A page fault occurs whenever the Valid/Invalid bit in the page table entry is marked 0. The OS trap handler halts the process, locates the requested page in secondary storage (swap/disk), finds an available frame in physical memory, loads the page, updates the page table entry to Valid (1), and restarts the interrupted instruction.

Translation Lookaside Buffer (TLB): A hardware cache storing recent virtual-to-physical address mappings to avoid two memory accesses per data lookup. A TLB miss incurs a page table lookup.

Thrashing: Occurs when the sum of working sets of active processes exceeds physical memory, causing the operating system to spend virtually all its time servicing page faults rather than executing instructions.`,
      createdAt: Date.now() - 3600 * 1000 * 24 * 2,
      updatedAt: Date.now() - 3600 * 1000 * 24 * 2,
    };

    await this.saveMaterial(sampleMaterial);

    const sampleConcepts: Concept[] = [
      {
        id: 'c-page-fault',
        materialId: sampleMaterial.id,
        title: 'Page Fault Mechanism',
        definition: 'A hardware-triggered interrupt occurring when an instruction references a virtual page with an invalid or unmapped page table entry.',
        keyPrinciples: [
          'Occurs regardless of whether RAM is full (triggered by valid/invalid bit, not memory capacity).',
          'CPU halts the instruction and traps into OS kernel mode.',
          'OS locates block on backing store and loads into a free physical frame.',
          'Page table valid bit is flipped to 1, and the faulting instruction is restarted.'
        ],
        sourceExcerpt: 'A Page Fault occurs when a program attempts to access a page that is mapped in the virtual address space but is NOT currently loaded in physical RAM. Crucially: A page fault is NOT an indication that memory is full.',
        state: 'NEEDS_REPAIR',
        attemptsCount: 1,
        detectedWeakness: 'Assumes page faults only trigger when RAM is 100% full.',
        createdAt: Date.now() - 3600 * 1000 * 24,
      },
      {
        id: 'c-tlb-cache',
        materialId: sampleMaterial.id,
        title: 'Translation Lookaside Buffer (TLB)',
        definition: 'An associative hardware cache of page-table translations to eliminate the performance penalty of multi-step memory address resolution.',
        keyPrinciples: [
          'Stores virtual page number to physical frame number mappings.',
          'Checked in parallel before reading page tables from RAM.',
          'A TLB miss triggers a page table walk in memory.'
        ],
        sourceExcerpt: 'Translation Lookaside Buffer (TLB): A hardware cache storing recent virtual-to-physical address mappings to avoid two memory accesses per data lookup.',
        state: 'INTRODUCED',
        attemptsCount: 0,
        createdAt: Date.now() - 3600 * 1000 * 24,
      },
      {
        id: 'c-thrashing',
        materialId: sampleMaterial.id,
        title: 'Thrashing',
        definition: 'A state where the system is so starved of physical frames that it spends virtually all processing time paging in and out rather than executing instructions.',
        keyPrinciples: [
          'Caused when total working set sizes exceed physical memory.',
          'CPU utilization drops sharply as processes wait on disk I/O.',
          'Countered by working-set models or suspending processes.'
        ],
        sourceExcerpt: 'Thrashing: Occurs when the sum of working sets of active processes exceeds physical memory, causing the operating system to spend virtually all its time servicing page faults.',
        state: 'UNSEEN',
        attemptsCount: 0,
        createdAt: Date.now() - 3600 * 1000 * 24,
      }
    ];

    await this.saveConcepts(sampleConcepts);

    // Seed a sample past session illustrating the exact friend failure identified in Phase 1
    const sampleSession: ProofSession = {
      id: 'session-demo-1',
      conceptId: 'c-page-fault',
      conceptTitle: 'Page Fault Mechanism',
      materialId: sampleMaterial.id,
      originalExplanation: 'A page fault is an error that happens when your RAM is completely full, so the computer has to pause and swap something to the hard drive to free up space.',
      claimsIdentified: [
        'Page fault is an error condition',
        'Triggered specifically when RAM is 100% full',
        'Causes swapping to free space'
      ],
      challengeType: 'counterexample',
      targetedWeakness: 'Belief that page faults only happen when RAM has zero free bytes.',
      challengePrompt: 'Suppose a newly started process with 8GB of free, unallocated physical RAM attempts to read a valid file-backed variable from its heap for the first time. Why does the CPU still trigger a Page Fault?',
      defenseText: 'Because it still has to make room for other programs even if there is free RAM.',
      verdict: 'NEEDS_REPAIR',
      whatGotRight: 'Recognized that page faults involve swapping and moving data into memory.',
      whatBroke: 'Confused memory capacity with the Valid/Invalid bit status in the page table. A page fault occurs on first access (demand paging) even with empty RAM.',
      whyItMatters: 'If you assume page faults mean RAM is full, you cannot diagnose demand paging latency or memory-mapped file initialization.',
      whatToFix: 'Clarify the role of the Valid/Invalid bit and why demand paging produces intentional page faults in empty memory.',
      repairDirective: 'Explain what happens during the very first instruction execution of a newly loaded process before any data is loaded into RAM.',
      timestamp: Date.now() - 3600 * 1000 * 4,
    };

    await this.saveSession(sampleSession);
  }
}

export const storage = new ProofStorage();
