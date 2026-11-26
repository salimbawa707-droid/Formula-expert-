
import {
  CategoryModelValidationSummary,
  CalibrationCandidateProposal,
  proposeCalibrationCandidates,
} from './labEvidenceEngine';
import { saveCalibrationProposal } from '../services/calibrationService';
import { auth } from '../services/firebaseClient';

export class CalibrationEngine {
  
  public static async generateAndSaveProposals(
    validationSummary: CategoryModelValidationSummary
  ): Promise<CalibrationCandidateProposal[]> {
    const proposals = proposeCalibrationCandidates(validationSummary);
    const userId = auth?.currentUser?.uid;
    
    if (userId) {
      for (const proposal of proposals) {
        await saveCalibrationProposal(userId, proposal);
      }
    }
    return proposals;
  }
  
  // ... rest of the class
  
  public static applyProposal(proposal: CalibrationCandidateProposal): { success: boolean; message: string } {
    if (proposal.status !== 'PROPOSED') {
      return { success: false, message: 'Proposal is not in a valid state to be applied.' };
    }
    
    // Proposal generation is implemented; runtime parameter mutation is not.
    // Never report success until an approved, versioned parameter write has
    // actually completed. Keep the proposal in PROPOSED state for review.
    return {
      success: false,
      message: 'Calibration application is not implemented. Proposal remains PROPOSED; no model parameter was changed.'
    };
  }
}
