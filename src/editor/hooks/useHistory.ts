import { useState, useCallback, useRef } from 'react';
import { EditorElement, HistoryStep } from '../types/editorTypes';

const MAX_HISTORY_LENGTH = 50;

export interface UseHistoryReturn {
  elements: EditorElement[];
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  setSelectedId: (id: string | null) => void;
  setElementsDirect: (elements: EditorElement[]) => void;
  pushState: (newElements: EditorElement[], description: string, newSelectedId?: string | null) => void;
  undo: () => void;
  redo: () => void;
  resetHistory: (initialElements: EditorElement[]) => void;
}

export function useHistory(initialElements: EditorElement[] = []): UseHistoryReturn {
  const [elements, setElements] = useState<EditorElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pastRef = useRef<HistoryStep[]>([]);
  const futureRef = useRef<HistoryStep[]>([]);
  const presentRef = useRef<{ elements: EditorElement[]; selectedId: string | null }>({
    elements: initialElements,
    selectedId: null,
  });

  const [historyVersion, setHistoryVersion] = useState<number>(0);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const pushState = useCallback((newElements: EditorElement[], description: string, newSelectedId?: string | null) => {
    const currentSelectedId = newSelectedId !== undefined ? newSelectedId : presentRef.current.selectedId;

    // Push current present to past
    pastRef.current = [
      ...pastRef.current.slice(-MAX_HISTORY_LENGTH + 1),
      {
        description,
        elements: presentRef.current.elements,
        selectedId: presentRef.current.selectedId,
      },
    ];

    // Clear redo future when a new action is performed
    futureRef.current = [];

    // Set new present
    presentRef.current = {
      elements: newElements,
      selectedId: currentSelectedId,
    };

    setElements(newElements);
    setSelectedId(currentSelectedId);
    setHistoryVersion((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;

    const previousStep = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);

    // Push present to future
    futureRef.current = [
      {
        description: 'Redo',
        elements: presentRef.current.elements,
        selectedId: presentRef.current.selectedId,
      },
      ...futureRef.current,
    ];

    // Restore previous
    presentRef.current = {
      elements: previousStep.elements,
      selectedId: previousStep.selectedId,
    };

    setElements(previousStep.elements);
    setSelectedId(previousStep.selectedId);
    setHistoryVersion((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;

    const nextStep = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);

    // Push present to past
    pastRef.current = [
      ...pastRef.current,
      {
        description: 'Undo',
        elements: presentRef.current.elements,
        selectedId: presentRef.current.selectedId,
      },
    ];

    // Restore next
    presentRef.current = {
      elements: nextStep.elements,
      selectedId: nextStep.selectedId,
    };

    setElements(nextStep.elements);
    setSelectedId(nextStep.selectedId);
    setHistoryVersion((v) => v + 1);
  }, []);

  const resetHistory = useCallback((initElements: EditorElement[]) => {
    pastRef.current = [];
    futureRef.current = [];
    presentRef.current = {
      elements: initElements,
      selectedId: null,
    };
    setElements(initElements);
    setSelectedId(null);
    setHistoryVersion((v) => v + 1);
  }, []);

  const setElementsDirect = useCallback((newElements: EditorElement[]) => {
    presentRef.current.elements = newElements;
    setElements(newElements);
  }, []);

  return {
    elements,
    selectedId,
    canUndo,
    canRedo,
    setSelectedId,
    setElementsDirect,
    pushState,
    undo,
    redo,
    resetHistory,
  };
}
