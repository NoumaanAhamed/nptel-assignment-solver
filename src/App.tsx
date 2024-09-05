import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalyzedAnswer {
  [key: number]: string;
}

const NPTELAssignmentAnalyzer: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [courseCode, setCourseCode] = useState<string>('');
  const [weekAssignment, setWeekAssignment] = useState<string>('');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [analyzedAnswers, setAnalyzedAnswers] = useState<AnalyzedAnswer>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAuthenticate = async (): Promise<void> => {
    if (username && password) {
      try {
        const authToken = btoa(`${username}:${password}`);
        const response = await fetch('https://ocr-backend.noumaanahamed.workers.dev/auth/page', {
          headers: {
            'Authorization': `Basic ${authToken}`
          }
        });

        if (response.ok) {
          setIsAuthenticated(true);
          setError('');
        } else {
          setError('Authentication failed. Please check your credentials.');
        }
      } catch (err) {
        setError(`Authentication failed. Please try again. ${err}`);
      }
    } else {
      setError('Please enter both username and password');
    }
  };

  const analyzeQuestion = async (questionNum: number): Promise<void> => {
    const authToken = btoa(`${username}:${password}`);
    const imageUrl = `https://storage.googleapis.com/swayam-node1-production.appspot.com/assets/img/${courseCode}/w${weekAssignment}a${weekAssignment}q${questionNum}.png`;

    try {
      const analyzeResponse = await fetch('https://ocr-backend.noumaanahamed.workers.dev/auth/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authToken}`
        },
        body: JSON.stringify({
          url: imageUrl,
          question: "Analyze this assignment question and provide a concise answer"
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error(`Failed to analyze image for question ${questionNum}`);
      }

      const data = await analyzeResponse.json();
      setAnalyzedAnswers(prev => ({ ...prev, [questionNum]: data.message.content }));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    }
  };

  const handleAnalyze = async (): Promise<void> => {
    setLoading(true);
    setError('');
    setAnalyzedAnswers({});

    try {
      for (const q of selectedQuestions) {
        await analyzeQuestion(q);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAll = async (): Promise<void> => {
    setLoading(true);
    setError('');
    setAnalyzedAnswers({});

    try {
      for (let i = 1; i <= 15; i++) {
        await analyzeQuestion(i);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (questionNum: number): void => {
    setSelectedQuestions(prev =>
      prev.includes(questionNum)
        ? prev.filter(q => q !== questionNum)
        : [...prev, questionNum]
    );
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-2"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
          />
          <Button onClick={handleAuthenticate}>Authenticate</Button>
          {error && <Alert variant="destructive" className="mt-2"><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>NPTEL Assignment Analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Course Code (e.g., noc24_cs115) - Check URL of the assignment page"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          />
          <Input
            placeholder="Week/Assignment Number"
            type="number"
            value={weekAssignment}
            onChange={(e) => setWeekAssignment(e.target.value)}
          />
          <div>
            <p className="mb-2">Select questions to analyze:</p>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(15)].map((_, i) => (
                <div key={i + 1} className="flex items-center space-x-2">
                  <Checkbox
                    id={`q${i + 1}`}
                    checked={selectedQuestions.includes(i + 1)}
                    onCheckedChange={() => handleQuestionSelect(i + 1)}
                  />
                  <label htmlFor={`q${i + 1}`}>{i + 1}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleAnalyze}
              disabled={loading || !courseCode || !weekAssignment || selectedQuestions.length === 0}
            >
              {loading ? 'Analyzing...' : 'Analyze Selected Questions'}
            </Button>
            <Button
              onClick={handleAnalyzeAll}
              disabled={loading || !courseCode || !weekAssignment}
            >
              {loading ? 'Analyzing...' : 'Analyze All Questions'}
            </Button>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {Object.entries(analyzedAnswers).map(([q, answer]) => (
            <div key={q} className="mt-4">
              <h3 className="font-semibold mb-2">Question {q} Analysis:</h3>
              <p>{answer}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NPTELAssignmentAnalyzer;