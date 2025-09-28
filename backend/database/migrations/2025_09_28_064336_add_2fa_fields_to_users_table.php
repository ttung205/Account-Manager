<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google2fa_secret')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->timestamp('two_factor_verified_at')->nullable();
            $table->json('backup_codes')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->integer('failed_login_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'google2fa_secret',
                'two_factor_enabled',
                'two_factor_verified_at',
                'backup_codes',
                'last_login_at',
                'last_login_ip',
                'failed_login_attempts',
                'locked_until'
            ]);
        });
    }
};
