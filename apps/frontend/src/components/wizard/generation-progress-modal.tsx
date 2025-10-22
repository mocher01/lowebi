import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Rocket,
} from 'lucide-react';

interface GenerationTask {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  siteId?: string;
  siteUrl?: string; // URL complète avec IP:PORT
  port?: number;    // Port assigné (3000-3100)
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

interface GenerationProgressModalProps {
  taskId: string;
  onClose: () => void;
}

export function GenerationProgressModal({ taskId, onClose }: GenerationProgressModalProps) {
  const [task, setTask] = useState<GenerationTask | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollProgress = async () => {
      try {
        const response = await fetch(`/customer/sites/generate/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('customer_access_token')}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setTask(data.task);

          // Stop polling when completed or failed
          if (data.task.status === 'completed' || data.task.status === 'failed') {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      }
    };

    // Initial fetch
    pollProgress();

    // Poll every 2 seconds
    if (isPolling) {
      intervalId = setInterval(pollProgress, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [taskId, isPolling]);

  const getStatusColor = () => {
    if (!task) return 'text-muted-foreground';

    switch (task.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    if (!task) return <Loader2 className="h-6 w-6 animate-spin" />;

    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'in_progress':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin" />;
    }
  };

  const handleViewSite = () => {
    if (task?.siteUrl) {
      // Utiliser l'URL complète retournée par le backend
      window.open(task.siteUrl, '_blank');
    } else if (task?.port) {
      // Construire l'URL avec IP et port
      const serverIp = window.location.hostname;
      window.open(`http://${serverIp}:${task.port}`, '_blank');
    } else if (task?.siteId) {
      // Fallback vers le domaine (pour compatibilité future)
      window.open(`http://${task.siteId}.locod-ai.com`, '_blank');
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Site Generation
          </DialogTitle>
          <DialogDescription>
            {task?.status === 'completed'
              ? 'Your website has been generated successfully!'
              : task?.status === 'failed'
              ? 'Generation failed. Please try again.'
              : 'Your website is being generated...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={getStatusColor()}>
                {task?.currentStep || 'Initializing...'}
              </span>
              <span className="font-medium">{task?.progress || 0}%</span>
            </div>
            <Progress value={task?.progress || 0} className="h-2" />
          </div>

          {/* Status Icon */}
          <div className="flex justify-center py-4">
            {getStatusIcon()}
          </div>

          {/* Error Message */}
          {task?.status === 'failed' && task.error && (
            <Alert variant="destructive">
              <AlertDescription>{task.error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message with Site URL */}
          {task?.status === 'completed' && (task?.siteUrl || task?.port || task?.siteId) && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Votre site est déployé et accessible à:{' '}
                <strong>
                  {task.siteUrl
                    ? task.siteUrl
                    : task.port
                      ? `http://${window.location.hostname}:${task.port}`
                      : `http://${task.siteId}.locod-ai.com`
                  }
                </strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {task?.status === 'completed' && (task?.siteUrl || task?.port || task?.siteId) && (
              <Button onClick={handleViewSite} className="bg-indigo-600 hover:bg-indigo-700">
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir le Site
              </Button>
            )}
            {task?.status === 'failed' && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
            {task?.status === 'completed' && (
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            )}
          </div>

          {/* Processing Steps Info */}
          {task?.status === 'in_progress' && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Generation Steps:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Validating configuration</li>
                <li>Generating site ID</li>
                <li>Copying template files</li>
                <li>Creating automation workflows</li>
                <li>Building React application</li>
                <li>Deploying to server</li>
                <li>Configuring domain</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
