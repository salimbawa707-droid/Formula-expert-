
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import { doc, setDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { CalibrationCandidateProposal } from '../utils/labEvidenceEngine';

/**
 * Service to manage Calibration Proposals in Firestore.
 */

export async function saveCalibrationProposal(userId: string, proposal: CalibrationCandidateProposal): Promise<void> {
  const proposalId = proposal.proposalId;
  const path = `users/${userId}/calibration_proposals/${proposalId}`;
  try {
    const docRef = doc(db, 'users', userId, 'calibration_proposals', proposalId);
    await setDoc(docRef, {
      ...proposal,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserCalibrationProposals(userId: string): Promise<CalibrationCandidateProposal[]> {
  const path = `users/${userId}/calibration_proposals`;
  try {
    const colRef = collection(db, 'users', userId, 'calibration_proposals');
    const q = query(colRef, orderBy('proposedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as CalibrationCandidateProposal);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}
