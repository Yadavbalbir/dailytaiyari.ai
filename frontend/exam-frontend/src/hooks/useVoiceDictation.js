import { useCallback, useEffect, useRef, useState } from 'react'
import courseAiService from '../services/courseAiService'

const SpeechRecognition =
    typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null

const canRecord =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    !!navigator?.mediaDevices?.getUserMedia

/**
 * Dictation for the prompt box.
 *
 * The browser's Web Speech API is the preferred path: it is free, streams
 * interim words as you speak, and the audio never leaves the machine. Where it
 * isn't available (Firefox, most desktop Safari builds) we fall back to
 * recording a clip and posting it to the backend, which forwards it to the
 * academy's *own* speech provider — so no new third party hears it either way.
 *
 * `onTranscript(text)` receives finalised text only; `interim` is exposed
 * separately so the UI can show the words as they are still being guessed.
 */
export default function useVoiceDictation({ onTranscript, language = 'en-IN' } = {}) {
    const [listening, setListening] = useState(false)
    const [interim, setInterim] = useState('')
    const [transcribing, setTranscribing] = useState(false)
    const [error, setError] = useState(null)

    const recognitionRef = useRef(null)
    const recorderRef = useRef(null)
    const chunksRef = useRef([])
    const streamRef = useRef(null)
    const callbackRef = useRef(onTranscript)
    callbackRef.current = onTranscript

    const supported = !!SpeechRecognition || canRecord
    const mode = SpeechRecognition ? 'speech' : canRecord ? 'recording' : 'none'

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
    }, [])

    const startSpeech = useCallback(() => {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = language

        recognition.onresult = (event) => {
            let pending = ''
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const result = event.results[i]
                if (result.isFinal) {
                    const text = result[0].transcript.trim()
                    if (text) callbackRef.current?.(text)
                } else {
                    pending += result[0].transcript
                }
            }
            setInterim(pending)
        }
        recognition.onerror = (event) => {
            // "aborted" and "no-speech" are normal parts of stopping; don't shout.
            if (event.error !== 'aborted' && event.error !== 'no-speech') {
                setError(
                    event.error === 'not-allowed'
                        ? 'Microphone access was blocked. Enable it in your browser settings.'
                        : 'Dictation stopped unexpectedly. Please try again.',
                )
            }
            setListening(false)
            setInterim('')
        }
        recognition.onend = () => {
            setListening(false)
            setInterim('')
        }

        recognitionRef.current = recognition
        recognition.start()
        setListening(true)
    }, [language])

    const startRecording = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        chunksRef.current = []

        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunksRef.current.push(event.data)
        }
        recorder.onstop = async () => {
            stopStream()
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
            chunksRef.current = []
            if (blob.size < 1200) return // A click, not speech.

            setTranscribing(true)
            try {
                const { text } = await courseAiService.transcribe(blob)
                if (text?.trim()) callbackRef.current?.(text.trim())
            } catch (err) {
                setError(
                    err?.response?.data?.detail ||
                        'Could not transcribe the recording. Please type your request instead.',
                )
            } finally {
                setTranscribing(false)
            }
        }

        recorderRef.current = recorder
        recorder.start()
        setListening(true)
    }, [stopStream])

    const start = useCallback(async () => {
        setError(null)
        if (listening) return
        try {
            if (SpeechRecognition) startSpeech()
            else if (canRecord) await startRecording()
            else setError('Voice input is not supported in this browser.')
        } catch (err) {
            setListening(false)
            setError(
                err?.name === 'NotAllowedError'
                    ? 'Microphone access was blocked. Enable it in your browser settings.'
                    : 'Could not start the microphone.',
            )
        }
    }, [listening, startSpeech, startRecording])

    const stop = useCallback(() => {
        recognitionRef.current?.stop()
        recognitionRef.current = null
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
        recorderRef.current = null
        setListening(false)
        setInterim('')
    }, [])

    const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop])

    useEffect(
        () => () => {
            recognitionRef.current?.abort?.()
            if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
            stopStream()
        },
        [stopStream],
    )

    return { supported, mode, listening, interim, transcribing, error, start, stop, toggle }
}
