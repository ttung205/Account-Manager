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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('service_name');
            $table->string('username');
            $table->text('encrypted_password'); // Mã hóa bằng client-side
            $table->text('encrypted_note')->nullable();
            $table->string('website_url')->nullable();
            $table->string('category')->default('general');
            $table->boolean('favorite')->default(false);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index(['user_id', 'service_name']);
            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'favorite']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
