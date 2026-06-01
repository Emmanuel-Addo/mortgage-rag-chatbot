// Shared state to transfer user input and files between home page and chat page
export interface SharedState {
  initialQuestion?: string;
  initialFile?: File | null;
}

export const sharedState: SharedState = {
  initialQuestion: undefined,
  initialFile: null,
};
