<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private string $resetUrl,
        private string $type,
        private string $token
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $subject = $this->type === 'master' 
            ? 'Đặt lại Master Password' 
            : 'Đặt lại mật khẩu đăng nhập';

        $greeting = "Xin chào {$notifiable->name},";
        
        $intro = $this->type === 'master'
            ? 'Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu đặt lại Master Password cho tài khoản của bạn.'
            : 'Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu đặt lại mật khẩu đăng nhập cho tài khoản của bạn.';

        return (new MailMessage)
            ->subject($subject)
            ->greeting($greeting)
            ->line($intro)
            ->action('Đặt lại mật khẩu', $this->resetUrl)
            ->line('Link này sẽ hết hạn sau 60 phút.')
            ->line('Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.')
            ->salutation('Trân trọng, Account Manager Team');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'token' => $this->token,
            'reset_url' => $this->resetUrl,
        ];
    }
}
